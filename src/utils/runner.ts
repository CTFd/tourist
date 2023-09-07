import os from "os";
import fs from "fs";

import _ from "lodash";
import { VM } from "vm2";
import playwright, { Browser, BrowserContext, LaunchOptions, Page } from "playwright";

import {
  JobBrowser,
  JobCookieType,
  JobOptions,
  JobResultType,
  JobStepType,
  PDFOptionsType,
} from "../schemas/api";

export type PlaywrightRunnerData = {
  browser: JobBrowser;
  steps: JobStepType[];
  cookies: JobCookieType[];
  options: JobOptions[];
  pdf?: PDFOptionsType;
};

// PlaywrightRunner executes steps and actions in an isolated context
export class PlaywrightRunner {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  public options: JobOptions[] = [];
  public readonly browserKind: JobBrowser;
  public readonly steps: JobStepType[];
  public readonly cookies: JobCookieType[];
  public readonly pdf?: PDFOptionsType;

  private _dialogMessages: string[] = [];
  private readonly _debug: boolean;

  constructor(data: PlaywrightRunnerData, debug: boolean = false) {
    this.browserKind = data.browser;
    this.steps = data.steps;
    this.cookies = data.cookies;
    this.options = data.options;

    if (data.pdf) {
      this.pdf = data.pdf;
    }

    this._debug = debug;
  }

  // init() initializes playwright: browser, context and page
  // it is intentionally separated from exec to allow for modifying playwright
  public async init() {
    const launchOptions: LaunchOptions = {
      // adding minimal slowMo resolves all sorts of issues regarding waiting for js
      // execution or load state - without requiring to always wait for networkidle.
      // it's an intentional trade-off - as it's better to always wait 50ms longer
      // than to have to wait for networkidle state which may lead to stalling.
      slowMo: 50,
    };

    if (this._debug) {
      launchOptions.slowMo = 1000;
      launchOptions.headless = false;
    }

    switch (this.browserKind) {
      case JobBrowser.CHROMIUM:
        this.browser = await playwright.chromium.launch(launchOptions);
        break;

      case JobBrowser.FIREFOX:
        this.browser = await playwright.firefox.launch(launchOptions);
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
    if (!this.page || !this.context) {
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
        [actions.preOpen, actions.postOpen] = _.partition(
          step.actions,
          (action) =>
            action.startsWith("page.on") ||
            action.startsWith("page.setDefaultTimeout") ||
            action.startsWith("page.setDefaultNavigationTimeout") ||
            action.startsWith("page.setExtraHTTPHeaders") ||
            action.startsWith("context.on") ||
            action.startsWith("context.setDefaultTimeout") ||
            action.startsWith("context.setDefaultNavigationTimeout") ||
            action.startsWith("context.setExtraHTTPHeaders"),
        );
      }

      // provide the page & context objects to the isolated context
      const vm = new VM({
        eval: false,
        wasm: false,
      });

      const { page, context } = this;
      vm.freeze(page, "page");
      vm.freeze(context, "context");

      if (this._debug) {
        vm.freeze(console, "console");
      }

      // run all pre-open actions for this step
      if (step.actions && actions.preOpen) {
        for (const preOpenAction of actions.preOpen) {
          try {
            await vm.run(preOpenAction);
          } catch (e: any) {
            const msg = e.message ? ` - ${e.message}` : "";
            await this.teardown();
            throw new Error(`[runtime] invalid action "${preOpenAction}"${msg}`);
          }
        }
      }

      // register handlers required for reading alerts
      // they will overwrite any user-provided context.on("page") as well as
      // page.on("dialog") handlers, which is intended
      if (this.options.includes(JobOptions.READ_ALERTS)) {
        // handler for reading alerts
        const onDialog = async (dialog: playwright.Dialog) => {
          // only read text from alerts - skip confirms, prompts and beforeunload
          if (dialog.type() === "alert") {
            try {
              const msg = dialog.message();
              await dialog.dismiss();

              // only push the value if dialog hasn't been handled (dismiss doesn't throw an error)
              this._dialogMessages.push(msg);
            } catch (e: any) {
              // playwright will throw an error if dialog has already been handled
            }
          }
        };

        // add listener for current page
        this.page.on("dialog", onDialog);

        // add listener for possible new pages / popups
        this.context.on("page", async (page: playwright.Page) => {
          page.on("dialog", onDialog);

          // auto-close new pages after they reach load state.
          // control over this can't be provided to the user because
          // READ_ALERTS option needs to overwrite any handlers for new pages.

          try {
            await page.waitForLoadState();
            await page.close();
          } catch (e: any) {
            // the page can be already closed if the browser begins working on the next step
            // catch the error and ignore this
          }
        });
      }

      try {
        await this.page.goto(step.url);
        await this.page.waitForLoadState();
      } catch (e) {
        await this.teardown();
        throw new Error(`[runtime] failed navigating to URL: '${step.url}'`);
      }

      // run all post-open actions for this step
      if (step.actions && actions.postOpen) {
        for (const postOpenAction of actions.postOpen) {
          try {
            await vm.run(postOpenAction);
            await this.page.waitForLoadState();
          } catch (e: any) {
            const msg = e.message ? ` - ${e.message}` : "";
            await this.teardown();
            throw new Error(`[runtime] invalid action "${postOpenAction}"${msg}`);
          }
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

    if (this.options.includes(JobOptions.READ_ALERTS)) {
      result.messages = [...this._dialogMessages];
    }

    if (this.options.includes(JobOptions.SCREENSHOT)) {
      const screenshotBuffer = await this.page!.screenshot({ fullPage: true });
      result.screenshot = screenshotBuffer.toString("base64");
    }

    if (this.options.includes(JobOptions.PDF)) {
      let pdfBuffer;

      if (this.pdf) {
        await this.page.emulateMedia({ media: this.pdf.media });

        if (this.pdf.js && this.pdf.delay > 0) {
          await this.page.waitForTimeout(this.pdf.delay);
        }

        pdfBuffer = await this.page.pdf({
          format: this.pdf.format,
          landscape: this.pdf.landscape,
          margin: this.pdf.margin,
          scale: this.pdf.scale,
          width: this.pdf.size?.width,
          height: this.pdf.size?.height,
          printBackground: this.pdf.background,
        });
      } else {
        pdfBuffer = await this.page.pdf();
      }

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
