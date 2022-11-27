import Queue from "bull";
import { legacySimpleVisitJob, SimpleVisitJobData } from "./jobs/legacy";

const SimpleVisitQueue = new Queue<SimpleVisitJobData>(
  "Simple Visit Job",
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
);

// Assign worker function for the queue
SimpleVisitQueue.process(legacySimpleVisitJob);

export { SimpleVisitQueue };
