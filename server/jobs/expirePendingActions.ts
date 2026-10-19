import type { AnyDb } from "../db/seed";
import { expirePendingActions } from "../services/pendingActions";
import type { JobDefinition } from "./definitions";

// Marks overdue approval-queue items EXPIRED (ADR 0015). Needs a db, so it is built by a factory.
export function createExpirePendingActionsJob(db: AnyDb): JobDefinition {
  return {
    name: "expire-pending-actions",
    cron: "*/10 * * * *",
    retryLimit: 2,
    retryDelaySeconds: 30,
    handler: async (_data, ctx) => {
      const n = await expirePendingActions(db);
      if (n > 0) ctx.log(`expired ${n} pending action(s)`);
    },
  };
}
