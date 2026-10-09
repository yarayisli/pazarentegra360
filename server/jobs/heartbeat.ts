import type { JobDefinition } from "./definitions";

// Sample job: proves the worker and cron are alive. It never touches a marketplace.
export const heartbeatJob: JobDefinition = {
  name: "heartbeat",
  cron: "*/5 * * * *",
  retryLimit: 0,
  retryDelaySeconds: 0,
  handler: async (_data, ctx) => {
    ctx.log("heartbeat");
  },
};
