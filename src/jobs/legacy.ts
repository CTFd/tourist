import fs from "fs";
import { Job } from "bull";

import { LegacyCookieType, LegacyStepType } from "../schemas/legacy";
import { LegacyPlaywrightRunner } from "../utils/runner";

export declare type SimpleVisitJobData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
};

export const legacySimpleVisitJob = async (job: Job<SimpleVisitJobData>) => {
  const runner = new LegacyPlaywrightRunner({
    ...job.data,
    screenshot: false,
    pdf: false,
    record: false,
  });

  try {
    await runner.init();
    await runner.exec();
    await runner.teardown();
  } catch (e) {
    console.error(e);
  }
};

export declare type ReturningVisitJobData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
  record: boolean;
  screenshot: boolean;
  pdf: boolean;
};

// this is not a scheduler job but accomplishes similar goals, so it's been put here for logical separation
// in fact it's just an async function that does the visiting job and returns necessary data
// it can't be scheduled because it needs to return data
export const legacyReturningVisitJob = async (data: ReturningVisitJobData) => {
  const runner = new LegacyPlaywrightRunner(data);

  try {
    await runner.init();
    await runner.exec();
  } catch (e) {
    // re-throw error to be handled in the controller
    throw e;
  }

  if (data.screenshot) {
    const screenshotBuffer = await runner.page!.screenshot({ fullPage: true });
    const file = screenshotBuffer.toString("base64");
    return { status: "success", result: { screenshot: file } };
  }

  if (data.pdf) {
    const pdfBuffer = await runner.page!.pdf();
    const file = pdfBuffer.toString("base64");
    return { status: "success", result: { pdf: file } };
  }

  await runner.teardown();

  if (data.record) {
    const video = await runner.page!.video();

    if (video) {
      const path = await video.path();
      const videoBuffer = fs.readFileSync(path);
      const file = videoBuffer.toString("base64");
      fs.unlinkSync(path);
      return { status: "success", result: { video: file } };
    }
  }
};
