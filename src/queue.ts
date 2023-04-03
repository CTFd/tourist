import Queue from "bull";
import { legacySimpleVisitJob, LegacySimpleVisitJobData } from "./jobs/legacy";
import { asyncVisitJob, VisitJobData } from "./jobs/api";

import config from "./config";

const LegacySimpleVisitQueue = new Queue<LegacySimpleVisitJobData>(
  "Legacy Simple Visit Job",
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
);

const AsyncVisitQueue = new Queue<VisitJobData>(
  "Async Visit Job",
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
);

// Assign worker functions to queues
LegacySimpleVisitQueue.process(config.CONCURRENCY, legacySimpleVisitJob);
AsyncVisitQueue.process(config.CONCURRENCY, asyncVisitJob);

export { LegacySimpleVisitQueue, AsyncVisitQueue };
