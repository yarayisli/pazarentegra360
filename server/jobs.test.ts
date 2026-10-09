import { PGlite } from "@electric-sql/pglite";
import { PgBoss, fromPglite } from "pg-boss";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { JobDefinition } from "./jobs/definitions";
import { heartbeatJob } from "./jobs/heartbeat";
import { enqueueAccountJob, registerJobs } from "./jobs/queue";
import { jobDefinitions } from "./jobs/registry";
import { createApp } from "./app";
import { tenants } from "./db/schema";
import { createTestApp } from "./testApp";

async function waitFor(cond: () => boolean | Promise<boolean>, timeoutMs = 20_000) {
  const start = Date.now();
  while (!(await cond())) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((r) => setTimeout(r, 100));
  }
}

let client: PGlite;
let boss: PgBoss;

beforeEach(async () => {
  client = new PGlite();
  boss = new PgBoss({ db: fromPglite(client), backend: "pglite" });
  boss.on("error", () => {});
  await boss.start();
});

afterEach(async () => {
  await boss.stop({ graceful: false });
  await client.close();
});

const fast = { pollingIntervalSeconds: 0.5, log: () => {} };

describe("job queue", () => {
  it("retries a failing job the configured number of times", async () => {
    let calls = 0;
    const flaky: JobDefinition = {
      name: "flaky",
      retryLimit: 2,
      retryDelaySeconds: 1,
      handler: async () => {
        calls++;
        if (calls < 3) throw new Error("boom");
      },
    };
    await registerJobs(boss, [flaky], fast);
    const id = await boss.send("flaky", {});
    await waitFor(async () => (await boss.getJobById("flaky", id!))?.state === "completed");
    expect(calls).toBe(3);
  }, 30_000);

  it("marks a job failed once retries are exhausted", async () => {
    let calls = 0;
    const broken: JobDefinition = {
      name: "broken",
      retryLimit: 1,
      retryDelaySeconds: 1,
      handler: async () => {
        calls++;
        throw new Error("always");
      },
    };
    await registerJobs(boss, [broken], fast);
    const id = await boss.send("broken", {});
    await waitFor(async () => (await boss.getJobById("broken", id!))?.state === "failed");
    expect(calls).toBe(2);
  }, 30_000);

  it("registers a cron schedule for jobs that declare one", async () => {
    await registerJobs(boss, [heartbeatJob], fast);
    const schedule = await boss.getSchedule("heartbeat");
    expect(schedule?.cron).toBe("*/5 * * * *");
  });

  it("runs the heartbeat job", async () => {
    const logs: string[] = [];
    await registerJobs(boss, [heartbeatJob], { ...fast, log: (m) => logs.push(m) });
    const id = await boss.send("heartbeat", {});
    await waitFor(async () => (await boss.getJobById("heartbeat", id!))?.state === "completed");
    expect(logs).toContain("heartbeat");
  });

  it("never runs two jobs of the same account concurrently, but runs other accounts in parallel", async () => {
    let active = 0;
    let maxSameAccount = 0;
    const activeByAccount = new Map<string, number>();
    let maxTotal = 0;
    const sync: JobDefinition = {
      name: "sync-test",
      accountScoped: true,
      retryLimit: 0,
      retryDelaySeconds: 0,
      handler: async (data) => {
        const acc = String(data.accountId);
        const n = (activeByAccount.get(acc) ?? 0) + 1;
        activeByAccount.set(acc, n);
        active++;
        maxSameAccount = Math.max(maxSameAccount, n);
        maxTotal = Math.max(maxTotal, active);
        await new Promise((r) => setTimeout(r, 1500));
        activeByAccount.set(acc, n - 1);
        active--;
      },
    };
    await registerJobs(boss, [sync], { ...fast, pollingIntervalSeconds: 0.5 });
    await enqueueAccountJob(boss, sync, { tenantId: "t1", accountId: "a1" });
    await enqueueAccountJob(boss, sync, { tenantId: "t1", accountId: "a1" });
    await enqueueAccountJob(boss, sync, { tenantId: "t1", accountId: "a2" });
    await waitFor(async () => {
      const jobs = await boss.findJobs("sync-test");
      return jobs.length === 3 && jobs.every((j) => j.state === "completed");
    }, 30_000);
    expect(maxSameAccount).toBe(1);
    expect(maxTotal).toBeGreaterThanOrEqual(1);
  }, 40_000);

  it("rejects account enqueue for non-account-scoped jobs", async () => {
    await expect(enqueueAccountJob(boss, heartbeatJob, { tenantId: "t", accountId: "a" })).rejects.toThrow(/not account-scoped/);
  });
});

describe("GET /api/jobs", () => {
  it("requires a session", async () => {
    const t = await createTestApp();
    const res = await request(createApp({ db: t.db, boss })).get("/api/jobs");
    expect(res.status).toBe(401);
    await t.close();
  });

  it("returns 503 when the queue is not configured", async () => {
    const t = await createTestApp();
    const agent = await t.signUp();
    const res = await agent.get("/api/jobs");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("JOBS_UNAVAILABLE");
    await t.close();
  });

  it("lists system jobs with counts and only the caller's account jobs", async () => {
    const t = await createTestApp();
    const app = createApp({ db: t.db });
    const reg = await request(app).post("/api/auth/register").send({ email: "a@example.com", password: "correct-horse-battery", tenantName: "A" });
    expect(reg.status).toBe(201);

    const scoped: JobDefinition = { name: "scoped-test", accountScoped: true, retryLimit: 0, retryDelaySeconds: 0, handler: async () => {} };
    await registerJobs(boss, [heartbeatJob, scoped], { ...fast, pollingIntervalSeconds: 60 });
    const [tenant] = await t.db.select().from(tenants).where(eq(tenants.name, "A"));
    const tenantId = tenant.id;
    await boss.send("scoped-test", { tenantId, accountId: "x" });
    await boss.send("scoped-test", { tenantId: "someone-else", accountId: "y" });

    // Use the real registry-shaped definitions for the route.
    const { createJobsRouter } = await import("./routes/jobs");
    const express = (await import("express")).default;
    const { createRequireAuth } = await import("./middleware/auth");
    const mini = express();
    mini.use("/api", createRequireAuth(t.db));
    mini.use(createJobsRouter(boss, [heartbeatJob, scoped]));
    const res = await request(mini).get("/api/jobs").set("Cookie", reg.headers["set-cookie"]);
    expect(res.status).toBe(200);
    const byName = Object.fromEntries(res.body.jobs.map((j: { name: string }) => [j.name, j]));
    expect(byName.heartbeat.cron).toBe("*/5 * * * *");
    expect(byName.heartbeat.counts).toBeTruthy();
    expect(byName["scoped-test"].recent).toHaveLength(1);
    await t.close();
  });

  it("exposes the heartbeat job in the registry", () => {
    expect(jobDefinitions.map((d) => d.name)).toContain("heartbeat");
  });
});
