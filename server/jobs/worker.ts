import dotenv from "dotenv";
import { getDatabaseUrl } from "../db/client";
import { createBoss, registerJobs } from "./queue";
import { jobDefinitions } from "./registry";

dotenv.config();

async function main() {
  const boss = createBoss(getDatabaseUrl(), "worker");
  boss.on("error", (err) => console.error("[job] pg-boss error", err));
  await boss.start();
  await registerJobs(boss, jobDefinitions);
  console.log(`Worker started with ${jobDefinitions.length} job(s).`);

  const shutdown = async () => {
    await boss.stop({ graceful: true });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
