import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";

import { createApp } from "../src/app";
import { JobBrowser, JobOptions } from "../src/schemas/api";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";
import { base64regex, getFreePort, getTestConfig } from "./utils/_common";

const test = anyTest as TestFn<{
  app: FastifyInstance;
  testApp: FastifyInstance;
  testAppURL: string;
}>;

test.before(async (t) => {
  const app = await createApp(
    { logger: false },
    getTestConfig({ ENABLE_AUTHENTICATION: false }),
  );

  const testAppPort = await getFreePort();
  const testApp = await startTestApp(
    { logger: false },
    { host: "localhost", port: testAppPort },
  );

  t.context = {
    // @ts-ignore: createApp returns a type extended with TypeBoxTypeProvider
    app,
    testApp,
    testAppURL: `http://localhost:${testAppPort}`,
  };
});

test.after(async (t) => {
  const { app, testApp } = t.context;
  await Promise.all([app.close(), testApp.close()]);
});

test("GET '/api/v1/sync-job' returns not found", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/sync-job",
  });

  t.is(response.statusCode, 404);
});

test("POST '/api/v1/sync-job' performs jobs without any results", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "success", result: {} });
});

test("POST '/api/v1/sync-job' creates pdf", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.PDF],
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.is(body.status, "success");
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(body.result.pdf), true);
});

test("POST '/api/v1/sync-job' creates screenshot", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.is(body.status, "success");
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(body.result.screenshot), true);
});

test("POST '/api/v1/sync-job' creates all of pdf, screenshot, video", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT, JobOptions.PDF, JobOptions.RECORD],
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.is(body.status, "success");
  t.assert(body.hasOwnProperty("result"));

  t.assert(body.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(body.result.screenshot), true);

  t.assert(body.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(body.result.pdf), true);

  t.assert(body.result.hasOwnProperty("video"));
  t.is(base64regex.test(body.result.video), true);
});

test("POST '/api/v1/sync-job' accepts cookies with domain / path combination", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost", path: "/" }],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "success", result: {} });
});

test("POST '/api/v1/sync-job' does not accept cookies with url", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", url: testAppURL }],
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    statusCode: 400,
    error: "Bad Request",
    message: "body/cookies/0 must have required property 'domain'",
  });
});

test("POST '/api/v1/sync-job' accepts cookies without path", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost" }],
    },
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), {
    status: "success",
    result: {},
  });
});

test("POST '/api/v1/sync-job' rejects cookies with invalid httpOnly property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
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

test("POST '/api/v1/sync-job' rejects cookies with invalid secure property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
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

test.serial("POST '/api/v1/sync-job' accepts chromium browser", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      browser: JobBrowser.CHROMIUM,
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.is(body.status, "success");
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(body.result.screenshot), true);
});
test.serial("POST '/api/v1/sync-job' accepts firefox browser", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      browser: JobBrowser.FIREFOX,
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);

  const body = response.json();
  t.is(body.status, "success");
  t.assert(body.hasOwnProperty("result"));
  t.assert(body.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(body.result.screenshot), true);
});

test("POST '/api/v1/sync-job' rejects unknown browsers", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      browser: "MyBrowser",
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 400);
  t.is(response.json().error, "Bad Request");
});
