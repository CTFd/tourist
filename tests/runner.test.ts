import { FastifyInstance } from "fastify";
import anyTest, { TestFn } from "ava";
import { v4 as uuid4 } from "uuid";

import { PlaywrightRunner } from "../src/utils/runner";
import { CookieSameSite, JobBrowser } from "../src/schemas/api";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";
import { getFreePort } from "./utils/_common";

const test = anyTest as TestFn<{
  testApp: FastifyInstance;
  testAppURL: string;
}>;

test.before(async (t) => {
  const testAppPort = await getFreePort();
  const testApp = await startTestApp(
    { logger: false },
    { host: "localhost", port: testAppPort },
  );

  t.context = {
    // @ts-ignore: createApp returns a type extended with TypeBoxTypeProvider
    testApp,
    testAppURL: `http://localhost:${testAppPort}`,
  };
});

test.after(async (t) => {
  const { testApp } = t.context;
  await testApp.close();
});

const testCookie = (name: string, value: string) => {
  return {
    name,
    value,
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
  };
};
test("PlaywrightRunner attaches cookies", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [{ url: `${testAppURL}/record-req?id=${testID}` }],
    cookies: [
      {
        name: "test",
        value: "test",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
      },
      {
        name: "test2",
        value: "test2",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
      },
    ],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("cookie"));
  t.is(headers.cookie, "test=test; test2=test2");
});

test("PlaywrightRunner attaches cookies with SameSite attribute", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [{ url: `${testAppURL}/record-req?id=${testID}` }],
    cookies: [
      {
        name: "test",
        value: "test",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: CookieSameSite.STRICT,
      },
      {
        name: "test2",
        value: "test2",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: CookieSameSite.LAX,
      },
      // not testing None as it'd require secure: true and an HTTPS enabled server
    ],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("cookie"));
  t.is(headers.cookie, "test=test; test2=test2");
});

test("PlaywrightRunner can use multiple steps", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID_1 = uuid4();
  const testID_2 = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      { url: `${testAppURL}/record-req?id=${testID_1}` },
      { url: `${testAppURL}/record-req?id=${testID_2}` },
    ],
    cookies: [testCookie("test", "test"), testCookie("test2", "test2")],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection_1 = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID_1,
    },
  });

  const inspection_2 = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID_2,
    },
  });

  const headers_1 = inspection_1.json().headers;
  t.assert(headers_1.hasOwnProperty("cookie"));
  t.is(headers_1.cookie, "test=test; test2=test2");

  const headers_2 = inspection_2.json().headers;
  t.assert(headers_2.hasOwnProperty("cookie"));
  t.is(headers_2.cookie, "test=test; test2=test2");
});

test("PlaywrightRunner saves set cookies", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/set-cookie?id=${testID}`,
        actions: ["page.waitForSelector('h1')"],
      },
    ],
    cookies: [testCookie("test", "test"), testCookie("test2", "test2")],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("cookie"));
  t.is(headers.cookie, `test=test; test2=test2; test_cookie=cookie-${testID}`);
});

test("PlaywrightRunner waits for loaded state", async (t) => {
  const { testAppURL } = t.context;

  const start = performance.now();
  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [{ url: `${testAppURL}/loading`, actions: [] }],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const end = performance.now();
  const execution = end - start;

  // 5s is both too long for usual execution and not too long for testing purposes
  t.assert(execution > 5300);
});

test("PlaywrightRunner steps can interact with anchors", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: ["page.click('#click')", "page.waitForSelector('h1')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/anchor?id=${testID}`);
});

test("PlaywrightRunner actions can use output from the context (for-async)", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/multiple-anchors?id=${testID}`,
        actions: [
          "page.locator('a').all()",
          `(async () => {
            for (const link of context[0]) {
              await link.click({ button: "middle" });
            }
          })()`,
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  for (let i = 1; i <= 3; i++) {
    const inspection = await testApp.inject({
      method: "GET",
      url: "/inspect-req",
      query: {
        id: `${testID}-${i}`,
      },
    });

    const { headers } = inspection.json();
    t.assert(headers.hasOwnProperty("referer"));
    t.is(headers.referer, `${testAppURL}/multiple-anchors?id=${testID}`);
  }
});

test("PlaywrightRunner actions can use output from the context (reduce-promise)", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/multiple-anchors?id=${testID}`,
        actions: [
          "page.locator('a').all()",
          `context[0].reduce(
            (previous, link) => previous.then(
              () => link.click({ button: "middle" }).then(null)
            ),
            Promise.resolve(null)
          );`,
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  for (let i = 1; i <= 3; i++) {
    const inspection = await testApp.inject({
      method: "GET",
      url: "/inspect-req",
      query: {
        id: `${testID}-${i}`,
      },
    });

    const { headers } = inspection.json();
    t.assert(headers.hasOwnProperty("referer"));
    t.is(headers.referer, `${testAppURL}/multiple-anchors?id=${testID}`);
  }
});

test("PlaywrightRunner actions can use output from the context (reduce-async)", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/multiple-anchors?id=${testID}`,
        actions: [
          "page.locator('a').all()",
          `context[0].reduce(
             async (previous, link) => {
               await previous;
               await link.click({ button: "middle" });
             },
             Promise.resolve(null)
           );`,
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  for (let i = 1; i <= 3; i++) {
    const inspection = await testApp.inject({
      method: "GET",
      url: "/inspect-req",
      query: {
        id: `${testID}-${i}`,
      },
    });

    const { headers } = inspection.json();
    t.assert(headers.hasOwnProperty("referer"));
    t.is(headers.referer, `${testAppURL}/multiple-anchors?id=${testID}`);
  }
});

test("PlaywrightRunner assigns correct index to output values in the context", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: [
          // output should still be available under context[0]
          // even though page.on will be moved before that
          "page.locator('a').all()",
          "page.on('dialog', dialog => dialog.accept())",
          `(async () => {
            for (const link of context[0]) {
              await link.click({ button: "middle" });
            }
          })()`,
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: `${testID}`,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/anchor?id=${testID}`);
});

test("PlaywrightRunner actions cannot generate code from strings", async (t) => {
  const { testAppURL } = t.context;
  const testID = uuid4();

  const runner_1 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: ["new Function('return (1+2)')()"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_1.init();
      await runner_1.exec();
      // code generation should not trigger, and the step should not complete
      // so the expected value here is undefined (no assignment has been made)
      t.assert(typeof runner_1.actionContext[0] === "undefined");
      await runner_1.finish();
    },
    { message: `[runtime] invalid action "new Function('return (1+2)')()"` },
  );

  const runner_2 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: [
          `(async () => {
            return new Function('return (1+2)')();
          })()`,
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_2.init();
      await runner_2.exec();
      // code generation should not trigger, and the step should not complete
      // so the expected value here is undefined (no assignment has been made)
      t.assert(typeof runner_2.actionContext[0] === "undefined");
      await runner_2.finish();
    },
    {
      message: (message) => {
        return (
          message.replace(/\s/g, "") ===
          `[runtime] invalid action "(async () => {
              return new Function('return (1+2)')();
          })()"`.replace(/\s/g, "")
        );
      },
    },
  );
});

test("PlaywrightRunner actions cannot assign properties to frozen objects", async (t) => {
  const { testAppURL } = t.context;
  const testID = uuid4();

  const runner_1 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: ["page.test = 'test'"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner_1.init();
  await runner_1.exec();
  t.false(runner_1.page!.hasOwnProperty("test"));
  await runner_1.finish();

  const runner_2 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/anchor?id=${testID}`,
        actions: ["context[1337] = 'test1337'"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner_2.init();
  await runner_2.exec();
  // assignment to an array will return the assigned value, so it's expected for this
  // value to be at index 0, and that the value at index 1337 wasn't assigned
  // the point of this test is not to ensure that dangerous values can't be returned
  // (covered by the test above), only that values at arbitrary indexes can't be assigned
  t.assert(runner_2.actionContext.indexOf("test1337") == 0);
  t.assert(runner_2.actionContext.indexOf("test1337") != 1337);
  await runner_2.finish();
});

test("PlaywrightRunner steps can interact with buttons", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/button?id=${testID}`,
        actions: ["page.click('#click')", "page.waitForSelector('h1')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/button?id=${testID}`);
});

test("PlaywrightRunner steps can interact with forms", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/form?id=${testID}`,
        actions: [
          "page.locator('#fillme').fill('test value')",
          "page.locator('#checkme').check()",
          "page.click('#submit')",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-form",
    query: {
      id: testID,
    },
  });

  const { headers, fillme, checkme } = inspection.json();
  t.is(fillme, "test value");
  t.is(checkme, "on");
  t.is(headers["content-type"], "application/x-www-form-urlencoded");
  t.is(headers.referer, `${testAppURL}/form?id=${testID}`);
});

test("PlaywrightRunner steps dismiss alerts implicitly", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/alert?id=${testID}`,
        actions: ["page.waitForSelector('h1')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/alert?id=${testID}`);
});

test("PlaywrightRunner steps can accept alerts", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/alert?id=${testID}`,
        actions: [
          "page.on('dialog', dialog => dialog.accept())",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/alert?id=${testID}`);
});

test("PlaywrightRunner steps can accept confirms", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/confirm?id=${testID}`,
        actions: [
          "page.on('dialog', dialog => dialog.accept())",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/confirm?id=${testID}`);
});

test("PlaywrightRunner steps can dismiss confirms", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/confirm?id=${testID}`,
        actions: [
          "page.on('dialog', dialog => dialog.dismiss())",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  // request shouldn't be recorded if the confirm is dismissed
  t.falsy(inspection.body);
});

test("PlaywrightRunner steps can answer prompts", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/prompt?id=${testID}`,
        actions: [
          "page.on('dialog', dialog => dialog.accept('confirm'))",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  const { headers } = inspection.json();
  t.assert(headers.hasOwnProperty("referer"));
  t.is(headers.referer, `${testAppURL}/prompt?id=${testID}`);
});

test("PlaywrightRunner steps can dismiss prompts", async (t) => {
  const { testApp, testAppURL } = t.context;
  const testID = uuid4();

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/prompt?id=${testID}`,
        actions: [
          "page.on('dialog', dialog => dialog.dismiss())",
          "page.waitForSelector('h1')",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  const inspection = await testApp.inject({
    method: "GET",
    url: "/inspect-req",
    query: {
      id: testID,
    },
  });

  // request shouldn't be recorded if the confirm is dismissed
  t.falsy(inspection.body);
});

test("PlaywrightRunner runs actions in an isolated context", async (t) => {
  const { testAppURL } = t.context;

  const runner_1 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["process.exit()"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_1.init();
      await runner_1.exec();
      await runner_1.finish();
    },
    { message: '[runtime] invalid action "process.exit()"' },
  );

  const runner_2 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["require('child_process').execSync('id')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_2.init();
      await runner_2.exec();
      await runner_2.finish();
    },
    { message: `[runtime] invalid action "require('child_process').execSync('id')"` },
  );

  const runner_3 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: [
          "process.mainModule.require('child_process').execSync('id').toString()",
        ],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_3.init();
      await runner_3.exec();
      await runner_3.finish();
    },
    {
      message: `[runtime] invalid action "process.mainModule.require('child_process').execSync('id').toString()"`,
    },
  );

  const runner_4 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["this.constructor.constructor('return process')().exit()"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_4.init();
      await runner_4.exec();
      await runner_4.finish();
    },
    {
      message: `[runtime] invalid action "this.constructor.constructor('return process')().exit()"`,
    },
  );
});

test("PlaywrightRunner closes the browser after completing the job", async (t) => {
  const { testAppURL } = t.context;

  const runner = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["page.waitForSelector('h1')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await runner.init();
  await runner.exec();
  await runner.finish();

  t.assert(runner.browser === undefined);
});

test("PlaywrightRunner closes the browser if an error occurs", async (t) => {
  const { testAppURL } = t.context;

  const runner_1 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["page.on('invalid')", "page.waitForSelector('h1')"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_1.init();
      await runner_1.exec();
      await runner_1.finish();
    },
    { message: `[runtime] invalid action "page.on('invalid')"` },
  );

  t.assert(runner_1.browser === undefined);

  const runner_2 = new PlaywrightRunner({
    browser: JobBrowser.CHROMIUM,
    steps: [
      {
        url: `${testAppURL}/`,
        actions: ["page.waitForSelector('nonexistent', {timeout: 1000})"],
      },
    ],
    cookies: [],
    options: [],
  });

  await t.throwsAsync(
    async () => {
      await runner_2.init();
      await runner_2.exec();
      await runner_2.finish();
    },
    {
      message: `[runtime] invalid action "page.waitForSelector('nonexistent', {timeout: 1000})"`,
    },
  );

  t.assert(runner_2.browser === undefined);
});
