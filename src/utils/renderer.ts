import playwright, { Browser, BrowserContext, Page } from "playwright";
import type { RenderRequestType } from "../schemas/render";

export class PlaywrightRenderer {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  private readonly data: RenderRequestType;
  private readonly _debug: boolean;

  constructor(data: RenderRequestType, debug: boolean = false) {
    this.data = data;
    this._debug = debug;
  }

  // init() initializes playwright: browser, context and page
  public async init() {
    if (this._debug) {
      this.browser = await playwright.chromium.launch({
        slowMo: 1000,
        headless: false,
      });
    } else {
      this.browser = await playwright.chromium.launch({ slowMo: 50 });
    }

    if (!this.data.js) {
      this.context = await this.browser.newContext({ javaScriptEnabled: false });
    } else {
      this.context = await this.browser.newContext();
    }

    this.page = await this.context.newPage();
  }

  // render will render the html and return a base64 encoded pdf
  public async render() {
    if (!this.page || !this.context) {
      throw new Error(
        `Attempted to render() on an uninitialized renderer, did you forget to call init() or has teardown() already been called?`,
      );
    }

    await this.page.setContent(this.data.html);
    await this.page.emulateMedia({ media: "screen" });

    if (this.data.js && this.data.delay > 0) {
      await this.page.waitForTimeout(this.data.delay);
    }

    const buffer = await this.page.pdf({
      format: this.data.format,
      landscape: this.data.landscape,
      margin: this.data.margin,
      scale: this.data.scale,
      width: this.data.size?.width,
      height: this.data.size?.height,
      printBackground: this.data.background,
    });

    return buffer.toString("base64");
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
