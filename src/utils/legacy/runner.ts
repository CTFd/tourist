import { PlaywrightRunner, PlaywrightRunnerData } from "../runner";
import { LegacyCookieType, LegacyStepType } from "../../schemas/legacy";
import { JobBrowser, JobOptions } from "../../schemas/jobs";

export type LegacyPlaywrightRunnerData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
  record: boolean;
  screenshot: boolean;
  pdf: boolean;
};

export class LegacyPlaywrightRunner extends PlaywrightRunner {
  constructor(legacyData: LegacyPlaywrightRunnerData) {
    const data: PlaywrightRunnerData = {
      browser: JobBrowser.CHROMIUM,
      steps: legacyData.steps,
      // LegacyCookie type is compatible with JobCookie, it just has certain assertions
      cookies: legacyData.cookies,
      options: [] as JobOptions[],
    };

    // convert options to new format
    if (legacyData.pdf) {
      data.options.push(JobOptions.PDF);
    }

    if (legacyData.screenshot) {
      data.options.push(JobOptions.SCREENSHOT);
    }

    if (legacyData.record) {
      data.options.push(JobOptions.RECORD);
    }

    super(data);
  }
}
