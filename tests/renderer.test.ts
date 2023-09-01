import test from "ava";
import { PlaywrightRenderer } from "../src/utils/renderer";
import { PageFormats } from "../src/schemas/render";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { base64regex } from "./utils/_common";

test("PlaywrightRenderer renders the PDF", async (t) => {
  const runner = new PlaywrightRenderer({
    html: "<html><body><h1>Hello World</h1></body></html>",
    format: PageFormats.A4,
    landscape: false,
    background: true,
    js: true,
    delay: 0,
    scale: 1.0,
  });

  await runner.init();
  const pdf = await runner.render();
  await runner.teardown();

  t.is(base64regex.test(pdf), true);
  t.is(pdf.length > 10000, true);
});

test("PlaywrightRenderer delays rendering the PDF", async (t) => {
  const runner = new PlaywrightRenderer({
    html: "<html><body><h1>Hello World</h1></body></html>",
    format: PageFormats.A4,
    landscape: false,
    background: true,
    js: true,
    delay: 5000,
    scale: 1.0,
  });

  const start = performance.now();

  await runner.init();
  await runner.render();
  await runner.teardown();

  const end = performance.now();
  const execution = end - start;
  t.assert(execution > 5000);
});

test("PlaywrightRenderer skips delay if js not enabled", async (t) => {
  const runner = new PlaywrightRenderer({
    html: "<html><body><h1>Hello World</h1></body></html>",
    format: PageFormats.A4,
    landscape: false,
    background: true,
    js: false,
    delay: 5000,
    scale: 1.0,
  });

  const start = performance.now();

  await runner.init();
  await runner.render();
  await runner.teardown();

  const end = performance.now();
  const execution = end - start;
  t.assert(execution < 3000);
});

test("PlaywrightRenderer closes the browser after completing the job", async (t) => {
  const runner = new PlaywrightRenderer({
    html: "<html><body><h1>Hello World</h1></body></html>",
    format: PageFormats.A4,
    landscape: false,
    background: true,
    js: true,
    delay: 0,
    scale: 1.0,
  });

  await runner.init();
  await runner.render();
  await runner.teardown();

  t.assert(runner.browser === undefined);
});
