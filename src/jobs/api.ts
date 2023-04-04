import util from "util";

import { Job } from "bull";
import * as Sentry from "@sentry/node";

import config from "../config";
import { JobBrowser, JobCookieType, JobOptions, JobStepType } from "../schemas/api";
import { PlaywrightRunner } from "../utils/runner";

export declare type VisitJobData = {
  browser: JobBrowser;
  steps: JobStepType[];
  cookies: JobCookieType[];
  options: JobOptions[];
};

export const asyncVisitJob = async (job: Job<VisitJobData>) => {
  const { data } = job;

  const runner = new PlaywrightRunner(data, config.DEBUG);

  try {
    await runner.init();
    await runner.exec();
  } catch (e: any) {
    if (config.SENTRY_DSN) {
      Sentry.captureException(e, {
        extra: { "Request Body": util.inspect(data, { depth: 5 }) },
      });
    }

    // change the job status to failed with the error message
    await job.moveToFailed({ message: e.message });
  }

  return await runner.finish();
};

export const syncVisitJob = async (data: VisitJobData) => {
  const runner = new PlaywrightRunner(data, config.DEBUG);

  try {
    await runner.init();
    await runner.exec();
  } catch (e: any) {
    // re-throw error to be handled in the controller
    throw e;
  }

  return await runner.finish();
};
