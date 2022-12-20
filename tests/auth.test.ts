import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";

import { createApp } from "../src/app";
import { AsyncVisitQueue } from "../src/queue";
import { getIssuerToken } from "../src/utils/auth";
import { JobOptions } from "../src/schemas/api";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { startTestApp } from "./utils/_app";
import {
  asyncJobResult,
  base64regex,
  getFreePort,
  getTestConfig,
  timestamp,
} from "./utils/_common";

const TEST_SECRET = "keyboard-cat";
const TEST_TOKEN = jwt.sign(
  {
    scope: "https://example.com",
    strict: false,
    iat: timestamp(),
    exp: timestamp() + 3600,
  },
  TEST_SECRET,
);
const TEST_ISSUER_TOKEN = getIssuerToken(TEST_SECRET);

const test = anyTest as TestFn<{
  app: FastifyInstance;
  testApp: FastifyInstance;
  testAppURL: string;
}>;

test.before(async (t) => {
  await AsyncVisitQueue.clean(100);

  const app = await createApp(
    { logger: false },
    getTestConfig({ ENABLE_AUTHENTICATION: true, SECRET: TEST_SECRET }),
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

test("POST '/api/v1/issue-token' issues token with default values", async (t) => {
  const { app } = t.context;

  const stamp = timestamp();
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/issue-token",
    payload: {
      scope: "https://example.com",
    },
    headers: {
      Authentication: `Bearer ${TEST_ISSUER_TOKEN}`,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("token"));

  const payload = jwt.verify(body.token, TEST_SECRET);
  if (typeof payload !== "object") {
    return t.fail("Token payload is not an object");
  }

  t.is(payload.scope, "https://example.com");
  t.is(payload.strict, false);
  t.assert(payload.iat! >= stamp);
  // default token life of 7 days + 3 seconds buffer
  t.assert(payload.exp! <= stamp + 604800 + 3 && payload.exp! >= stamp);
});

test("POST '/api/v1/issue-token' issues token with custom validity", async (t) => {
  const { app } = t.context;

  const stamp = timestamp();
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/issue-token",
    payload: {
      scope: "https://example.com",
      validity: 3600,
    },
    headers: {
      Authentication: `Bearer ${TEST_ISSUER_TOKEN}`,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("token"));

  const payload = jwt.verify(body.token, TEST_SECRET);
  if (typeof payload !== "object") {
    return t.fail("Token payload is not an object");
  }

  t.is(payload.scope, "https://example.com");
  t.is(payload.strict, false);
  t.assert(payload.iat! >= stamp);
  // provided token exp (3600) + 3 seconds buffer
  t.assert(payload.exp! <= stamp + 3600 + 3 && payload.exp! >= stamp);
});

test("POST '/api/v1/issue-token' issues token with strict attribute", async (t) => {
  const { app } = t.context;

  const stamp = timestamp();
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/issue-token",
    payload: {
      scope: "https://example.com",
      strict: true,
    },
    headers: {
      Authentication: `Bearer ${TEST_ISSUER_TOKEN}`,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("token"));

  const payload = jwt.verify(body.token, TEST_SECRET);
  if (typeof payload !== "object") {
    return t.fail("Token payload is not an object");
  }

  t.is(payload.scope, "https://example.com");
  t.is(payload.strict, true);
  t.assert(payload.iat! >= stamp);
});

test("POST '/api/v1/issue-token' rejects requests without authentication", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/issue-token",
    payload: {
      scope: "https://example.com",
    },
  });

  const body = response.json();
  t.is(response.statusCode, 400);
  t.deepEqual(body, {
    statusCode: 400,
    error: "Bad Request",
    message: "headers must have required property 'authentication'",
  });
});

test("POST '/api/v1/issue-token' rejects requests with invalid authentication", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/issue-token",
    payload: {
      scope: "https://example.com",
    },
    headers: {
      // correctly signed visit token - but not an issuer token
      Authentication: `Bearer ${TEST_TOKEN}`,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 401);
  t.deepEqual(body, {
    statusCode: 401,
    error: "Invalid Issuer Token",
    message: "Authorization header is either missing, malformed or incorrect",
  });
});

test("POST '/api/v1/async-job' validates authorization", async (t) => {
  const { app } = t.context;

  // token not present
  const response_1 = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: "https://example.com" }],
    },
  });

  t.is(response_1.statusCode, 401);
  const data_1 = response_1.json();
  t.deepEqual(data_1, {
    statusCode: 401,
    error: "Unauthenticated",
    message: "Authorization has not been provided",
  });

  // token invalid
  const response_2 = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: "https://example.com" }],
    },
    headers: {
      Authorization: "Bearer houghfduoihgdofugf",
    },
  });

  t.is(response_2.statusCode, 403);
  const data_2 = response_2.json();
  t.deepEqual(data_2, {
    statusCode: 403,
    error: "Forbidden",
    message: "Provided token does not allow visiting one or more of the requested URLs",
  });

  // requested url outside of token scope
  const response_3 = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: "https://example1.com" }],
    },
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
  });

  t.is(response_3.statusCode, 403);
  const data_3 = response_3.json();
  t.deepEqual(data_3, {
    statusCode: 403,
    error: "Forbidden",
    message: "Provided token does not allow visiting one or more of the requested URLs",
  });
});

test("POST '/api/v1/sync-job' validates authorization", async (t) => {
  const { app } = t.context;

  // token not present
  const response_1 = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: "https://example.com" }],
    },
  });

  t.is(response_1.statusCode, 401);
  const data_1 = response_1.json();
  t.deepEqual(data_1, {
    statusCode: 401,
    error: "Unauthenticated",
    message: "Authorization has not been provided",
  });

  // token invalid
  const response_2 = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: "https://example.com" }],
    },
    headers: {
      Authorization: "Bearer eyfdsfdsfsd.invalid-token.dsadasd",
    },
  });

  t.is(response_2.statusCode, 403);
  const data_2 = response_2.json();
  t.deepEqual(data_2, {
    statusCode: 403,
    error: "Forbidden",
    message: "Provided token does not allow visiting one or more of the requested URLs",
  });

  // requested url outside of token scope
  const response_3 = await app.inject({
    method: "POST",
    url: "/api/v1/sync-job",
    payload: {
      steps: [{ url: "https://example1.com" }],
    },
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
  });

  t.is(response_3.statusCode, 403);
  const data_3 = response_3.json();
  t.deepEqual(data_3, {
    statusCode: 403,
    error: "Forbidden",
    message: "Provided token does not allow visiting one or more of the requested URLs",
  });
});

test("GET '/api/v1/job-status' validates authorization", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/async-job",
    payload: {
      steps: [{ url: "https://example.com" }],
      options: [JobOptions.PDF, JobOptions.SCREENSHOT],
    },
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
  });

  const data = response.json();
  t.assert(data.hasOwnProperty("id"));

  // valid request
  const validResult = await asyncJobResult(app, data.id, TEST_TOKEN);
  t.assert(validResult.hasOwnProperty("status"));
  t.is(validResult.status, "success");

  t.assert(validResult.hasOwnProperty("result"));
  t.assert(validResult.result.hasOwnProperty("pdf"));
  t.is(base64regex.test(validResult.result.pdf), true);

  t.assert(validResult.hasOwnProperty("result"));
  t.assert(validResult.result.hasOwnProperty("screenshot"));
  t.is(base64regex.test(validResult.result.screenshot), true);

  // invalid request (no authorization)
  const notAuthorizationResult = await asyncJobResult(app, data.id);
  t.deepEqual(notAuthorizationResult, {
    statusCode: 401,
    error: "Unauthenticated",
    message: "Authorization has not been provided",
  });

  // invalid request (invalid authorization)
  const invalidAuthorizationResult = await asyncJobResult(
    app,
    data.id,
    "eydasdsa.invalid-token.dasdsa",
  );
  t.deepEqual(invalidAuthorizationResult, {
    statusCode: 403,
    error: "Forbidden",
    message: "Provided token does not allow retrieving data for this job",
  });
});
