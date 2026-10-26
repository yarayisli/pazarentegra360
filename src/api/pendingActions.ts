import { apiFetch } from "./client";

export type PendingActionStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "EXECUTED" | "FAILED";

export interface PendingActionView {
  id: string;
  accountId: string | null;
  marketplace: string;
  actionType: string;
  payload: unknown;
  riskReason: string;
  status: PendingActionStatus;
  error: string | null;
  createdAt: number;
  expiresAt: number;
  decidedAt: number | null;
  executedAt: number | null;
}

const BASE = "/api/pending-actions";

export const pendingActionsKey = ["pending-actions"] as const;

export const listPendingActions = async (status?: PendingActionStatus) =>
  (await apiFetch<{ actions: PendingActionView[] }>(BASE, { query: { status } })).actions;

export const approvePendingAction = async (id: string) =>
  (await apiFetch<{ action: PendingActionView }>(`${BASE}/${id}/approve`, { method: "POST" })).action;

export const rejectPendingAction = async (id: string) =>
  (await apiFetch<{ action: PendingActionView }>(`${BASE}/${id}/reject`, { method: "POST" })).action;
