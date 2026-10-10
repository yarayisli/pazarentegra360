import { Router } from "express";
import type { PgBoss } from "pg-boss";
import { tenantIdOf } from "../middleware/auth";
import { jobDefinitions } from "../jobs/registry";
import type { JobDefinition } from "../jobs/definitions";
import { listJobStatuses } from "../services/jobs";

export function createJobsRouter(boss: PgBoss | undefined, defs: JobDefinition[] = jobDefinitions) {
  const router = Router();

  router.get("/api/jobs", async (req, res, next) => {
    if (!boss) {
      return res
        .status(503)
        .json({ success: false, error: { code: "JOBS_UNAVAILABLE", message: "İş kuyruğu yapılandırılmadı." } });
    }
    try {
      res.json({ success: true, jobs: await listJobStatuses(boss, defs, tenantIdOf(req)) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
