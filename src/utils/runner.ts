import os from "os";
import _ from "lodash";
import playwright, { Browser, BrowserContext, Page } from "playwright";
import { VM } from "vm2";
import { LegacyCookieType, LegacyStepType } from "../schemas/legacy";

declare type LegacyPlaywrightRunnerData = {
  steps: LegacyStepType[];
  cookies: LegacyCookieType[];
  record: boolean;
  screenshot: boolean;
  pdf: boolean;
};

// LegacyPlaywrightRunner is a wrapper around playwright that executes legacy steps
// with actions in an isolated context. It supports both simple and returning jobs.
// it expects already validated and camelized actions,
// validation should be done in the controller to return an explicit error message to the user.
export class LegacyPlaywrightRunner {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  private readonly steps: LegacyStepType[];
  private readonly cookies: LegacyCookieType[];
  private readonly record: boolean = false;
  private readonly screenshot: boolean = false;
  private readonly pdf: boolean = false;

  constructor(data: LegacyPlaywrightRunnerData) {
    this.steps = data.steps;
    this.cookies = data.cookies;
    this.record = data.record;
    this.screenshot = data.screenshot;
    this.pdf = data.pdf;
  }

  // init() initializes playwright: browser, context and page
  // it is intentionally separated from exec to allow for modifying playwright
  public async init() {
    this.browser = await playwright.chromium.launch();

    if (this.record) {
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
        [actions.preOpen, actions.postOpen] = _.partition(step.actions, action =>
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
