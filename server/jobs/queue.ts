import { PgBoss } from "pg-boss";
import { accountJobKey, type AccountJobData, type JobDefinition } from "./definitions";

export function createBoss(connectionString: string, role: "api" | "worker"): PgBoss {
  // Only the worker supervises queues and fires cron; the API just sends and reads jobs.
  return new PgBoss({ connectionString, supervise: role === "worker", schedule: role === "worker" });
}

export interface RegisterOptions {
  pollingIntervalSeconds?: number;
  log?: (message: string) => void;
}

// Creates queues (idempotent), starts workers and registers cron schedules.
export async function registerJobs(boss: PgBoss, defs: JobDefinition[], opts: RegisterOptions = {}) {
  const log = opts.log ?? ((m: string) => console.log(`[job] ${m}`));
  for (const def of defs) {
    await boss.createQueue(def.name, {
      policy: def.accountScoped ? "singleton" : "standard",
      retryLimit: def.retryLimit,
      retryDelay: def.retryDelaySeconds,
      retryBackoff: true,
    });
    await boss.work<Record<string, unknown>>(
      def.name,
      { pollingIntervalSeconds: opts.pollingIntervalSeconds ?? 2 },
      async (jobs) => {
        for (const job of jobs) await def.handler(job.data ?? {}, { log });
      },
    );
    if (def.cron) await boss.schedule(def.name, def.cron, {});
  }
}

// Same account + same job never run concurrently (singleton policy keyed by tenant:account).
export async function enqueueAccountJob(boss: PgBoss, def: JobDefinition, data: AccountJobData) {
  if (!def.accountScoped) throw new Error(`Job ${def.name} is not account-scoped`);
  return boss.send(def.name, data, { singletonKey: accountJobKey(data) });
}
