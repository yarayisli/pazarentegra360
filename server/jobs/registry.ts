import type { JobDefinition } from "./definitions";
import { heartbeatJob } from "./heartbeat";

export const jobDefinitions: JobDefinition[] = [heartbeatJob];
