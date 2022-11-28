import { FastifyInstance } from "fastify";
import anyTest, { TestFn } from "ava";
import { v4 as uuid4 } from "uuid";

import { createApp } from "../src/app";
import { SimpleVisitQueue } from "../src/queue";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";

const test = anyTest as TestFn<{
  app: FastifyInstance;
  testApp: FastifyInstance;
  testAppURL: string;
}>;

const base64regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const whenJobsFinished = async () => {
  // check if the queue has no active and pending jobs every 100ms
  // whenJobsFinished only accounts for active jobs
  // in addition there's a slight time window before the job
  // is scheduled, so it might trigger on an empty queue
  while (true) {
    await sleep(100);
    const { waiting, active } = await SimpleVisitQueue.getJobCounts();

    if (waiting + active == 0) {
      break;
    }
  }
};

test.beforeEach(async t => {
  // make sure queue is clean before proceeding
  await SimpleVisitQueue.clean(100);
});

test.before(async t => {
  const app = await createApp({ logger: false });
  const testApp = await startTestApp(
    { logger: false },
    { host: "localhost", port: 3333 },
  );

  t.context = {
    // @ts-ignore: createApp returns a type extended with TypeBoxTypeProvider
    app,
    testApp,
    testAppURL: `http://localhost:3333`,
  };
});

test("GET '/visit' returns not found", async t => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/visit",
  });

  t.is(response.statusCode, 404);
});

test("POST '/visit' accepts valid request", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "scheduled" });
});

test("POST '/visit' validates steps", async t => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {},
  });

  t.is(response.statusCode, 400);
});

test("POST '/visit' records video", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      record: true,
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("video"));
  t.truthy(base64regex.exec(body.result.video));
});

test("POST '/visit' creates pdf", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      pdf: true,
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("pdf"));
  t.truthy(base64regex.exec(body.result.pdf));
});

test("POST '/visit' creates screenshot", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      screenshot: true,
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("screenshot"));
  t.truthy(base64regex.exec(body.result.screenshot));
});

test("POST '/visit' does not accept multiple record, pdf, screenshot properties", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      pdf: true,
      screenshot: true,
    },
  });

  t.is(response.statusCode, 400);
  t.is(
    response.json().message,
    "Exactly one option of [record, screenshot, pdf] can be used at a time",
  );
});

test("POST '/visit' accepts valid cookies", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "test" }],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "scheduled" });
});

test("POST '/visit' rejects cookies without required properties", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test" }],
    },
  });

  t.is(response.statusCode, 400);
});

test("POST '/visit' rejects cookies with invalid httpOnly property", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ httpOnly: "test" }],
    },
  });

  t.is(response.statusCode, 400);
});

test("POST '/visit' rejects cookies with invalid secure property", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ secure: "test" }],
    },
  });

  t.is(response.statusCode, 400);
});

// TODO: sameSite is currently excluded as it breaks cookies (schemas/legacy.ts)
//test("POST '/visit' rejects cookies with invalid sameSite property", async t => {
//  const { app, testAppURL } = t.context;
//
//  const response = await app.inject({
//    method: "POST",
//    url: "/visit",
//    payload: {
//      steps: [{ url: testAppURL }],
//      cookies: [{ name: "test", value: "test", domain: "test", sameSite: "test" }],
//    },
//  });
//
//  t.is(response.statusCode, 400);
//});

test("POST '/visit' rejects invalid pre open actions", async t => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          // missing final )
          actions: ["page.on('dialog'"],
        },
      ],
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: `invalid action "page.on('dialog'" - does not end with ")" or ");"`,
  });
});

test("POST '/visit' rejects invalid post open actions", async t => {
  const { app, testAppURL } = t.context;

  const response_1 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          // does not start with page
          actions: ["sheesh"],
        },
      ],
    },
  });

  t.is(response_1.statusCode, 400);
  t.deepEqual(response_1.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: 'invalid action "sheesh" - does not start with "page."',
  });

  const response_2 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          // missing final )
          actions: ["page.goto('https://example.com'"],
        },
      ],
    },
  });

  t.is(response_2.statusCode, 400);
  t.deepEqual(response_2.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
  });
});

test.serial("POST '/visit' attaches cookies to the browser", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: `${testAppURL}/record-req?id=${testID}` }],
      cookies: [
        { name: "test", value: "test", domain: "localhost" },
        { name: "test2", value: "test2", domain: "localhost" },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' can use multiple steps", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID_1 = uuid4();
  const testID_2 = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        { url: `${testAppURL}/record-req?id=${testID_1}` },
        { url: `${testAppURL}/record-req?id=${testID_2}` },
      ],
      cookies: [
        { name: "test", value: "test", domain: "localhost" },
        { name: "test2", value: "test2", domain: "localhost" },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' saves set cookies", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/set-cookie?id=${testID}`,
          actions: ["page.waitForSelector('h1')"],
        },
      ],
      cookies: [
        { name: "test", value: "test", domain: "localhost" },
        { name: "test2", value: "test2", domain: "localhost" },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' waits for loaded state", async t => {
  const { app, testAppURL } = t.context;

  const start = performance.now();
  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: `${testAppURL}/loading` }],
    },
  });

  await whenJobsFinished();

  const end = performance.now();
  const execution = end - start;

  // 5s is both too long for usual execution and not too long for testing purposes
  t.assert(execution > 5500);
});

test.serial("POST '/visit' steps can interact with anchors", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/anchor?id=${testID}`,
          actions: ["page.click('#click')", "page.waitForSelector('h1')"],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can interact with buttons", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/button?id=${testID}`,
          actions: ["page.click('#click')", "page.waitForSelector('h1')"],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can interact with forms", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
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
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps dismiss alerts implicitly", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/alert?id=${testID}`,
          actions: ["page.waitForSelector('h1')"],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can accept alerts", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/alert?id=${testID}`,
          actions: [
            "page.on('dialog', dialog => dialog.accept())",
            "page.waitForSelector('h1')",
          ],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can accept confirms", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/confirm?id=${testID}`,
          actions: [
            "page.on('dialog', dialog => dialog.accept())",
            "page.waitForSelector('h1')",
          ],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can dismiss confirms", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/confirm?id=${testID}`,
          actions: [
            "page.on('dialog', dialog => dialog.dismiss())",
            "page.waitForSelector('h1')",
          ],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can answer prompts", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/prompt?id=${testID}`,
          actions: [
            "page.on('dialog', dialog => dialog.accept('confirm'))",
            "page.waitForSelector('h1')",
          ],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test.serial("POST '/visit' steps can dismiss prompts", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/prompt?id=${testID}`,
          actions: [
            "page.on('dialog', dialog => dialog.dismiss())",
            "page.waitForSelector('h1')",
          ],
        },
      ],
    },
  });

  await whenJobsFinished();

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

test("POST '/visit' steps run actions in an isolated context", async t => {
  const { app, testAppURL } = t.context;

  const response_1 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          actions: ["page.; process.exit()"],
        },
      ],
      screenshot: true,
    },
  });

  t.is(response_1.statusCode, 400);
  t.deepEqual(response_1.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: 'invalid action "page.; process.exit()"',
  });

  const response_2 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          actions: ["page.; require('child_process').execSync('id')"],
        },
      ],
      screenshot: true,
    },
  });
  t.is(response_2.statusCode, 400);
  t.deepEqual(response_2.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "invalid action \"page.; require('child_process').execSync('id')\"",
  });

  const response_3 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          actions: [
            "page.; process.mainModule.require('child_process').execSync('id').toString()",
          ],
        },
      ],
      screenshot: true,
    },
  });
  t.is(response_3.statusCode, 400);
  t.deepEqual(response_3.json(), {
    statusCode: 400,
    error: "Bad Request",
    message:
      "invalid action \"page.; process.mainModule.require('child_process').execSync('id').toString()\"",
  });

  const response_4 = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/`,
          actions: ["page.; this.constructor.constructor('return process')().exit()"],
        },
      ],
      screenshot: true,
    },
  });
  t.is(response_4.statusCode, 400);
  t.deepEqual(response_4.json(), {
    statusCode: 400,
    error: "Bad Request",
    message:
      "invalid action \"page.; this.constructor.constructor('return process')().exit()\"",
  });
});

test.serial("POST '/visit' accepts snake cased method names", async t => {
  const { app, testApp, testAppURL } = t.context;
  const testID = uuid4();

  await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/anchor?id=${testID}`,
          actions: ["page.click('#click')", "page.wait_for_selector('h1')"],
        },
      ],
    },
  });

  await whenJobsFinished();

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
