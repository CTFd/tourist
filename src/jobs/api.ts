import util from "util";

import { Job } from "bull";
import * as Sentry from "@sentry/node";

import config from "../config";
import {
  JobBrowser,
  JobCookieType,
  JobOptions,
  JobStepType,
  PDFOptionsType,
} from "../schemas/api";
import { PlaywrightRunner } from "../utils/runner";

export type VisitJobData = {
  browser: JobBrowser;
  steps: JobStepType[];
  cookies: JobCookieType[];
  options: JobOptions[];
  pdf?: PDFOptionsType;
};

export const asyncVisitJob = async (job: Job<VisitJobData>) => {
  console.log(`job ${job.id} starting`);
  const data = job.data;
  console.log(job.data);
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
    console.log(`job ${job.id} failed`);
  }
  console.log(`job ${job.id} succeeded`);
  return await runner.finish();
};

export const syncVisitJob = async (data: VisitJobData) => {
  const runner = new PlaywrightRunner(data, config.DEBUG);
  console.log(data);

  try {
    await runner.init();
    await runner.exec();
  } catch (e: any) {
    // re-throw error to be handled in the controller
    throw e;
  }

  return await runner.finish();
};
