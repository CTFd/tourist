import { Job } from "bull";

import { LegacyCookieType, LegacyStepType } from "../schemas/legacy";
import { LegacyPlaywrightRunner } from "../utils/legacy/runner";
import { JobResultType } from "../schemas/api";

export type LegacySimpleVisitJobData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
};

export const legacySimpleVisitJob = async (job: Job<LegacySimpleVisitJobData>) => {
  const runner = new LegacyPlaywrightRunner({
    ...job.data,
    screenshot: false,
    pdf: false,
    record: false,
  });

  try {
    await runner.init();
    await runner.exec();

    // in a legacy simple job results can be discarded as there will never be any
    await runner.finish();
  } catch (e: any) {
    await job.moveToFailed({ message: e.message });
  }
};

export type LegacyReturningVisitJobData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
  record: boolean;
  screenshot: boolean;
  pdf: boolean;
};

// this is not a scheduler job but accomplishes similar goals, so it's been put here for logical separation
// in fact it's just an async function that does the visiting job and returns necessary data
// it can't be scheduled because it needs to return data
export const legacyReturningVisitJob = async (data: LegacyReturningVisitJobData) => {
  const runner = new LegacyPlaywrightRunner(data);

  try {
    await runner.init();
    await runner.exec();
  } catch (e) {
    // re-throw error to be handled in the controller
    throw e;
  }

  const result: JobResultType = await runner.finish();
  return { status: "success", result };
};
