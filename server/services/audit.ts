import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import type { Request } from "express";
import type { AnyDb } from "../db/seed";
import { auditLogs } from "../db/schema";

export interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  summary?: string;
  // For routes without a session yet (login, register).
  actor?: { tenantId: string; userId: string };
}

const SECRET_KEYS = /(api_?key|api_?secret|secret|service_?key|app_?key|password|parola|token|authorization)/i;

// Summaries should only hold field names, but "key=value" pairs for secret-looking keys are masked as a backstop.
export function maskSecrets(text: string): string {
  return text.replace(/([\w-]+)\s*[=:]\s*("[^"]*"|'[^']*'|\S+)/g, (m, key: string) =>
    SECRET_KEYS.test(key) ? `${key}=****` : m,
  );
}

export async function recordAudit(db: AnyDb, req: Request, entry: AuditEntry): Promise<void> {
  const actor = entry.actor ?? (req.auth ? { tenantId: req.auth.tenantId, userId: req.auth.userId } : undefined);
  if (!actor) return;
  try {
    await db.insert(auditLogs).values({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      summary: maskSecrets(entry.summary ?? "").slice(0, 500),
      ip: req.ip ?? null,
    });
  } catch (err) {
    // An audit failure must not undo the action that already happened.
    req.log?.error({ err, action: entry.action }, "audit log write failed");
  }
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  action?: string;
  from?: Date;
  to?: Date;
}

export async function listAuditLogs(db: AnyDb, tenantId: string, q: AuditQuery) {
  const where = and(
    eq(auditLogs.tenantId, tenantId),
    q.action ? eq(auditLogs.action, q.action) : undefined,
    q.from ? gte(auditLogs.createdAt, q.from) : undefined,
    q.to ? lte(auditLogs.createdAt, q.to) : undefined,
  );
  const [{ total }] = await db.select({ total: count() }).from(auditLogs).where(where);
  const items = await db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
    .limit(q.pageSize)
    .offset((q.page - 1) * q.pageSize);
  return { items, total, page: q.page, pageSize: q.pageSize };
}
