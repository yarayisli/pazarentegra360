import { and, desc, eq, gt, lte } from "drizzle-orm";
import type { AnyDb } from "../db/seed";
import { orderEvents, pendingActions, tenants } from "../db/schema";
import type { MarketplaceAdapter } from "../integrations/types";
import { AdapterNotRegisteredError, MARKETPLACE_CODES, type MarketplaceCode } from "../integrations/types";
import { evaluateAction, type OutboundAction } from "./safetyGuard";

// Safety brake workflow (ADR 0015): risky outbound actions wait here for a human decision.

export const PENDING_ACTION_TTL_MS = 24 * 60 * 60 * 1000;

export type AdapterResolver = (target: ActionTarget) => MarketplaceAdapter;
export interface ActionTarget {
  tenantId: string;
  accountId: string | null;
  marketplace: MarketplaceCode;
}

export const unavailableAdapterResolver: AdapterResolver = ({ marketplace }) => {
  throw new AdapterNotRegisteredError(marketplace);
};

export const isMarketplaceCode = (v: unknown): v is MarketplaceCode => MARKETPLACE_CODES.includes(v as MarketplaceCode);

export type PendingActionRow = typeof pendingActions.$inferSelect;

export interface PendingActionView {
  id: string;
  accountId: string | null;
  marketplace: string;
  actionType: string;
  payload: unknown;
  riskReason: string;
  status: string;
  error: string | null;
  createdAt: number;
  expiresAt: number;
  decidedAt: number | null;
  executedAt: number | null;
}

const toView = (r: PendingActionRow): PendingActionView => ({
  id: r.id,
  accountId: r.accountId,
  marketplace: r.marketplace,
  actionType: r.actionType,
  payload: r.payload,
  riskReason: r.riskReason,
  status: r.status,
  error: r.error,
  createdAt: r.createdAt.getTime(),
  expiresAt: r.expiresAt.getTime(),
  decidedAt: r.decidedAt?.getTime() ?? null,
  executedAt: r.executedAt?.getTime() ?? null,
});

// Dry run first, then the real call. Throws if either step fails.
async function execute(adapter: MarketplaceAdapter, action: OutboundAction): Promise<void> {
  switch (action.type) {
    case "UPDATE_STOCK_PRICE": {
      const updates = action.updates.map(({ barcode, stock, price }) => ({ barcode, stock, price }));
      await adapter.updateStockPrice(updates, { dryRun: true });
      await adapter.updateStockPrice(updates, { dryRun: false });
      return;
    }
    case "UPDATE_ORDER_STATUS": {
      const update = { externalId: action.externalId, status: action.status, invoiceNumber: action.invoiceNumber };
      await adapter.updateOrderStatus(update, { dryRun: true });
      await adapter.updateOrderStatus(update, { dryRun: false });
      return;
    }
    case "ANSWER_QUESTION": {
      const answer = { externalId: action.externalId, answer: action.answer };
      await adapter.answerQuestion(answer, { dryRun: true });
      await adapter.answerQuestion(answer, { dryRun: false });
      return;
    }
  }
}

// Order status actions leave a trace in the append-only event store.
async function recordOrderEvent(db: AnyDb, row: PendingActionRow, outcome: string, userId: string | null) {
  const action = row.payload as OutboundAction;
  if (action.type !== "UPDATE_ORDER_STATUS") return;
  await db
    .insert(orderEvents)
    .values({
      tenantId: row.tenantId,
      orderExternalId: Number(action.externalId) || null,
      orderNumber: action.orderNumber,
      marketplace: row.marketplace,
      fromStatus: "None",
      toStatus: action.status,
      eventSource: "USER_ACTION",
      idempotencyKey: `pending-action:${row.id}:${outcome}`,
      description: `Onay kuyruğu kararı: ${outcome}`,
      operatorName: userId,
      payloadSnapshot: { pendingActionId: row.id },
    })
    .onConflictDoNothing();
}

async function runAndFinish(
  db: AnyDb,
  row: PendingActionRow,
  resolve: AdapterResolver,
  userId: string | null,
): Promise<PendingActionRow> {
  const action = row.payload as OutboundAction;
  try {
    const adapter = resolve({
      tenantId: row.tenantId,
      accountId: row.accountId,
      marketplace: row.marketplace as MarketplaceCode,
    });
    await execute(adapter, action);
    const [done] = await db
      .update(pendingActions)
      .set({ status: "EXECUTED", executedAt: new Date() })
      .where(eq(pendingActions.id, row.id))
      .returning();
    await recordOrderEvent(db, row, "EXECUTED", userId);
    return done;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const [failed] = await db
      .update(pendingActions)
      .set({ status: "FAILED", error: message })
      .where(eq(pendingActions.id, row.id))
      .returning();
    await recordOrderEvent(db, row, "FAILED", userId);
    return failed;
  }
}

export type SubmitResult =
  { outcome: "EXECUTED" | "FAILED"; action: PendingActionView } | { outcome: "PENDING"; action: PendingActionView };

// Entry point for every outbound write: evaluates the rules, then either runs the action
// or parks it for approval. A parked action never reaches the marketplace adapter.
export async function submitAction(
  db: AnyDb,
  ctx: { tenantId: string; userId: string | null; accountId: string | null; marketplace: MarketplaceCode },
  action: OutboundAction,
  resolve: AdapterResolver,
  now = new Date(),
): Promise<SubmitResult> {
  const [tenant] = await db
    .select({ pct: tenants.priceDropThresholdPct })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId));
  const verdict = evaluateAction(action, { priceDropThresholdPct: tenant?.pct });
  const allowed = verdict.decision === "ALLOW";
  const [row] = await db
    .insert(pendingActions)
    .values({
      tenantId: ctx.tenantId,
      accountId: ctx.accountId,
      marketplace: ctx.marketplace,
      actionType: action.type,
      payload: action,
      riskReason: allowed ? "Risk yok" : verdict.reason,
      status: allowed ? "APPROVED" : "PENDING",
      createdBy: ctx.userId,
      expiresAt: new Date(now.getTime() + PENDING_ACTION_TTL_MS),
      decidedAt: allowed ? now : null,
    })
    .returning();
  if (!allowed) return { outcome: "PENDING", action: toView(row) };
  const finished = await runAndFinish(db, row, resolve, ctx.userId);
  return { outcome: finished.status === "EXECUTED" ? "EXECUTED" : "FAILED", action: toView(finished) };
}

export async function listPendingActions(db: AnyDb, tenantId: string, status?: string): Promise<PendingActionView[]> {
  const rows = await db
    .select()
    .from(pendingActions)
    .where(
      status
        ? and(eq(pendingActions.tenantId, tenantId), eq(pendingActions.status, status))
        : eq(pendingActions.tenantId, tenantId),
    )
    .orderBy(desc(pendingActions.createdAt))
    .limit(200);
  return rows.map(toView);
}

export type DecisionResult =
  { ok: true; action: PendingActionView } | { ok: false; reason: "NOT_FOUND" | "NOT_PENDING" };

// Claims the row atomically (PENDING → decided), so a double approve or a race can never
// run the action twice. Expired rows cannot be claimed even if the expiry job is late.
async function claim(
  db: AnyDb,
  tenantId: string,
  id: string,
  status: "APPROVED" | "REJECTED",
  userId: string,
  now: Date,
): Promise<{ row?: PendingActionRow; reason?: "NOT_FOUND" | "NOT_PENDING" }> {
  const [row] = await db
    .update(pendingActions)
    .set({ status, decidedBy: userId, decidedAt: now })
    .where(
      and(
        eq(pendingActions.id, id),
        eq(pendingActions.tenantId, tenantId),
        eq(pendingActions.status, "PENDING"),
        gt(pendingActions.expiresAt, now),
      ),
    )
    .returning();
  if (row) return { row };
  const [existing] = await db
    .select({ id: pendingActions.id })
    .from(pendingActions)
    .where(and(eq(pendingActions.id, id), eq(pendingActions.tenantId, tenantId)));
  return { reason: existing ? "NOT_PENDING" : "NOT_FOUND" };
}

export async function approveAction(
  db: AnyDb,
  tenantId: string,
  id: string,
  userId: string,
  resolve: AdapterResolver,
  now = new Date(),
): Promise<DecisionResult> {
  const claimed = await claim(db, tenantId, id, "APPROVED", userId, now);
  if (!claimed.row) return { ok: false, reason: claimed.reason! };
  const finished = await runAndFinish(db, claimed.row, resolve, userId);
  return { ok: true, action: toView(finished) };
}

export async function rejectAction(
  db: AnyDb,
  tenantId: string,
  id: string,
  userId: string,
  now = new Date(),
): Promise<DecisionResult> {
  const claimed = await claim(db, tenantId, id, "REJECTED", userId, now);
  if (!claimed.row) return { ok: false, reason: claimed.reason! };
  await recordOrderEvent(db, claimed.row, "REJECTED", userId);
  return { ok: true, action: toView(claimed.row) };
}

// Marks overdue PENDING rows EXPIRED; returns how many changed.
export async function expirePendingActions(db: AnyDb, now = new Date()): Promise<number> {
  const rows = await db
    .update(pendingActions)
    .set({ status: "EXPIRED", decidedAt: now })
    .where(and(eq(pendingActions.status, "PENDING"), lte(pendingActions.expiresAt, now)))
    .returning({ id: pendingActions.id });
  return rows.length;
}
