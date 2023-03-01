import { FastifyInstance } from "fastify";
import anyTest, { TestFn } from "ava";

import { createApp } from "../src/app";
import { LegacySimpleVisitQueue } from "../src/queue";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";
import { getTestConfig } from "./utils/_common";

const test = anyTest as TestFn<{
  app: FastifyInstance;
  testApp: FastifyInstance;
  testAppURL: string;
}>;

const base64regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

test.before(async (t) => {
  await LegacySimpleVisitQueue.clean(100);

  const app = await createApp(
    { logger: false },
    getTestConfig({ ENABLE_LEGACY_API: true }),
  );
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

test.after(async (t) => {
  const { app, testApp } = t.context;
  await Promise.all([app.close(), testApp.close()]);
});

test("GET '/visit' returns not found", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/visit",
  });

  t.is(response.statusCode, 404);
});

test("POST '/visit' accepts valid request", async (t) => {
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

test("POST '/visit' records video", async (t) => {
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
  t.is(base64regex.test(body.result.video), true);
});

test("POST '/visit' creates pdf", async (t) => {
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
  t.is(base64regex.test(body.result.pdf), true);
});

test("POST '/visit' creates screenshot", async (t) => {
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
  t.is(base64regex.test(body.result.screenshot), true);
});

test("POST '/visit' does not accept multiple record, pdf, screenshot properties", async (t) => {
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

test("POST '/visit' accepts valid cookies", async (t) => {
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

test("POST '/visit' rejects cookies without required properties", async (t) => {
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

test("POST '/visit' rejects cookies with invalid httpOnly property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost", httpOnly: "test" }],
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "body/cookies/0/httpOnly must be boolean",
  });
});

test("POST '/visit' rejects cookies with invalid secure property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost", secure: "test" }],
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "body/cookies/0/secure must be boolean",
  });
});

test("POST '/visit' rejects cookies with invalid sameSite property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "test", sameSite: "test" }],
    },
  });

  t.is(response.statusCode, 400);
});

test("POST '/visit' rejects invalid preOpen actions", async (t) => {
  const { app, testAppURL } = t.context;

  const response_1 = await app.inject({
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

  t.is(response_1.statusCode, 400);
  t.deepEqual(response_1.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: `invalid action "page.on('dialog'" - does not end with ")" or ");"`,
  });
});

test("POST '/visit' rejects invalid post open actions", async (t) => {
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

test("POST '/visit' accepts snake cased method names", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/visit",
    payload: {
      steps: [
        {
          url: `${testAppURL}/anchor?id=1337`,
          actions: ["page.click('#click')", "page.wait_for_selector('h1')"],
        },
      ],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "scheduled" });
});
