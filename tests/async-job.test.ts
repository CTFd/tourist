import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";

import { createApp } from "../src/app";
import { JobBrowser, JobOptions } from "../src/schemas/api";
import { AsyncVisitQueue } from "../src/queue";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";
import {
  asyncJobResult,
  base64regex,
  getFreePort,
  getTestConfig,
} from "./utils/_common";

const test = anyTest as TestFn<{
  app: FastifyInstance;
  testApp: FastifyInstance;
  testAppURL: string;
}>;

test.before(async (t) => {
  await AsyncVisitQueue.clean(100);

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

test("GET '/api/v1/async-job' returns not found", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/async-job",
  });

  t.is(response.statusCode, 404);
});

test("POST '/api/v1/async-job' performs jobs without any results", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.deepEqual(result.result, {});
});

test("POST '/api/v1/async-job' creates pdf", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.PDF],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.assert(result.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(result.result.pdf), true);
});

test("POST '/api/v1/async-job' creates screenshot", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.assert(result.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(result.result.screenshot), true);
});
test("POST '/api/v1/async-job' creates all of pdf, screenshot, video", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT, JobOptions.PDF, JobOptions.RECORD],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));

  t.assert(result.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(result.result.pdf), true);

  t.assert(result.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(result.result.screenshot), true);

  t.assert(result.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(result.result.pdf), true);
});

test("POST '/api/v1/async-job' accepts cookies with domain / path combination", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost", path: "/" }],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.deepEqual(result.result, {});
});

test("POST '/api/v1/async-job' does not accept cookies with url", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
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

test("POST '/api/v1/async-job' accepts cookies without path", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL }],
      cookies: [{ name: "test", value: "test", domain: "localhost" }],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");
});

test("POST '/api/v1/async-job' validates actions", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: testAppURL, actions: ["pge.click('#test')"] }],
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    statusCode: 400,
    error: "Action validation failed",
    message: `invalid action "pge.click('#test')" - does not start with "page."`,
  });
});

test("POST '/api/v1/async-job' rejects cookies with invalid httpOnly property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
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

test("POST '/api/v1/async-job' rejects cookies with invalid secure property", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
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

test("POST '/api/v1/async-job' rejects invalid actions", async (t) => {
  const { app, testAppURL } = t.context;

  const response_1 = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
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
    error: "Action validation failed",
    message: `invalid action "page.on('dialog'" - does not end with ")" or ");"`,
  });

  const response_2 = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
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

  t.is(response_2.statusCode, 400);
  t.deepEqual(response_2.json(), {
    statusCode: 400,
    error: "Action validation failed",
    message: `invalid action "sheesh" - does not start with "page."`,
  });
});

test.serial("POST '/api/v1/async-job' accepts chromium browser", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      browser: JobBrowser.CHROMIUM,
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.assert(result.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(result.result.screenshot), true);
});
test.serial("POST '/api/v1/async-job' accepts firefox browser", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      browser: JobBrowser.FIREFOX,
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 200);
  const data = response.json();
  t.assert(data.hasOwnProperty("status"));
  t.assert(data.hasOwnProperty("id"));
  t.is(data.status, "scheduled");
  t.assert(typeof data.id === "number");

  const result = await asyncJobResult(app, data.id);
  t.assert(result.hasOwnProperty("status"));
  t.is(result.status, "success");

  t.assert(result.hasOwnProperty("result"));
  t.assert(result.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(result.result.screenshot), true);
});

test("POST '/api/v1/async-job' rejects unknown browsers", async (t) => {
  const { app, testAppURL } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      browser: "MyBrowser",
      steps: [{ url: testAppURL }],
      options: [JobOptions.SCREENSHOT],
    },
  });

  t.is(response.statusCode, 400);
  t.is(response.json().error, "Bad Request");
});

test("GET '/api/v1/job-status' returns 404 if job is not found", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/job-status?id=7823423",
  });

  t.is(response.statusCode, 404);
  const data = response.json();
  t.deepEqual(data, {
    statusCode: 404,
    error: "Not Found",
    message: "Job with id '7823423' does not exist!",
  });
});
