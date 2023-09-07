import test from "ava";
import {
  LegacyPlaywrightRunner,
  LegacyPlaywrightRunnerData,
} from "../src/utils/legacy/runner";
import { JobOptions } from "../src/schemas/api";

test("LegacyPlaywrightRunner converts LegacyPlaywrightRunnerData to new format", async (t) => {
  const legacyData: LegacyPlaywrightRunnerData = {
    steps: [],
    cookies: [],
    record: true,
    screenshot: true,
    pdf: true,
  };

  const runner = new LegacyPlaywrightRunner(legacyData);

  t.is(runner.options.includes(JobOptions.PDF), true);
  t.is(runner.options.includes(JobOptions.SCREENSHOT), true);
  t.is(runner.options.includes(JobOptions.RECORD), true);
});
