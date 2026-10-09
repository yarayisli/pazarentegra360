import type { PgBoss } from "pg-boss";
import type { JobDefinition } from "../jobs/definitions";

export interface JobStatus {
  name: string;
  cron: string | null;
  accountScoped: boolean;
  counts: { queued: number; active: number; failed: number } | null;
  recent: { id: string; state: string; createdOn: string; completedOn: string | null; retryCount: number }[];
}

// Account-scoped queues mix tenants, so they only expose this tenant's own jobs.
export async function listJobStatuses(boss: PgBoss, defs: JobDefinition[], tenantId: string): Promise<JobStatus[]> {
  const out: JobStatus[] = [];
  for (const def of defs) {
    let counts: JobStatus["counts"] = null;
    let recent: JobStatus["recent"] = [];
    if (def.accountScoped) {
      const jobs = await boss.findJobs(def.name, { data: { tenantId } });
      recent = jobs.slice(0, 20).map(toRecent);
    } else {
      const q = await boss.getQueue(def.name);
      counts = q ? { queued: q.queuedCount, active: q.activeCount, failed: q.failedCount } : null;
    }
    out.push({ name: def.name, cron: def.cron ?? null, accountScoped: !!def.accountScoped, counts, recent });
  }
  return out;
}

function toRecent(j: { id: string; state: string; createdOn: Date; completedOn: Date | null; retryCount: number }) {
  return {
    id: j.id,
    state: j.state,
    createdOn: j.createdOn.toISOString(),
    completedOn: j.completedOn ? j.completedOn.toISOString() : null,
    retryCount: j.retryCount,
  };
}
