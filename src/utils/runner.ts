import os from "os";
import fs from "fs";

import _ from "lodash";
import { VM } from "vm2";
import playwright, { Browser, BrowserContext, Page } from "playwright";

import {
  JobBrowser,
  JobCookieType,
  JobOptions,
  JobResultType,
  JobStepType,
} from "../schemas/api";

export declare type PlaywrightRunnerData = {
  browser: JobBrowser;
  steps: JobStepType[];
  cookies: JobCookieType[];
  options: JobOptions[];
};

// PlaywrightRunner executes steps and actions in an isolated context
export class PlaywrightRunner {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  public readonly browserKind: JobBrowser;
  public readonly steps: JobStepType[];
  public readonly cookies: JobCookieType[];
  public options: JobOptions[] = [];

  constructor(data: PlaywrightRunnerData) {
    this.browserKind = data.browser;
    this.steps = data.steps;
    this.cookies = data.cookies;
    this.options = data.options;
  }

  // init() initializes playwright: browser, context and page
  // it is intentionally separated from exec to allow for modifying playwright
  public async init() {
    switch (this.browserKind) {
      case JobBrowser.CHROMIUM:
        this.browser = await playwright.chromium.launch();
        break;

      case JobBrowser.FIREFOX:
        this.browser = await playwright.firefox.launch();
        break;
    }

    if (this.options.includes(JobOptions.RECORD)) {
      this.context = await this.browser.newContext({
        recordVideo: { dir: os.tmpdir() },
      });
    } else {
      this.context = await this.browser.newContext();
    }

    if (this.cookies) {
      await this.context.addCookies(this.cookies);
    }

    this.page = await this.context.newPage();
  }

  // exec() iterates over steps, splits actions into pre- and post-open and executes
  // them in an isolated context with access only to the page
  public async exec() {
    if (!this.page) {
      throw new Error(
        `Attempted to exec() on an uninitialized runner, did you forget to call init() or has teardown() already been called?`,
      );
    }

    for (const step of this.steps) {
      // split step actions into preOpen and postOpen
      // listeners such as page.on need to be registered before page.goto()
      const actions = {
        preOpen: [] as string[],
        postOpen: [] as string[],
      };

      if (step.actions) {
        [actions.preOpen, actions.postOpen] = _.partition(step.actions, (action) =>
          action.startsWith("page.on"),
        );
      }

      // provide the page object to the isolated context
      const { page } = this;
      const vm = new VM({
        eval: false,
        wasm: false,
        sandbox: {
          page,
        },
      });

      // run all pre-open actions for this step
      for (const preOpenAction of actions.preOpen) {
        try {
          await (async () => vm.run(preOpenAction))();
        } catch (e) {
          throw new Error(`invalid action "${preOpenAction}"`);
        }
      }

      await this.page.goto(step.url);
      await this.page.waitForLoadState();

      // run all post-open actions for this step
      for (const postOpenAction of actions.postOpen) {
        try {
          await (async () => vm.run(postOpenAction))();
          await this.page.waitForLoadState();
        } catch (e) {
          throw new Error(`invalid action "${postOpenAction}"`);
        }
      }
    }
  }

  // finish() will gather requested results as well as close both the context and browser
  public async finish(): Promise<JobResultType> {
    if (!this.page) {
      throw new Error(
        `Attempted to finish() on an uninitialized runner, did you forget to call init() or has teardown() already been called?`,
      );
    }

    const result: JobResultType = {};

    if (this.options.includes(JobOptions.SCREENSHOT)) {
      const screenshotBuffer = await this.page!.screenshot({ fullPage: true });
      result.screenshot = screenshotBuffer.toString("base64");
    }

    if (this.options.includes(JobOptions.PDF)) {
      const pdfBuffer = await this.page!.pdf();
      result.pdf = pdfBuffer.toString("base64");
    }

    await this.teardown();

    if (this.options.includes(JobOptions.RECORD)) {
      const video = await this.page!.video();

      if (video) {
        const path = await video.path();
        const videoBuffer = fs.readFileSync(path);
        const file = videoBuffer.toString("base64");
        fs.unlinkSync(path);
        result.video = file;
      }
    }

    return result;
  }

  // teardown() removes the browser and context from the instance as well as closes them
  public async teardown() {
    if (this.context) {
      await this.context.close();
      delete this.context;
      this.context = undefined;
    }

    if (this.browser) {
      await this.browser.close();
      delete this.browser;
      this.browser = undefined;
    }
  }
}
