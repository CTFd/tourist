import anyTest, { TestFn } from "ava";
import { FastifyInstance } from "fastify";

import { createApp } from "../src/app";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { base64regex, getTestConfig } from "./utils/_common";
import { PageFormats } from "../src/schemas/render";

const test = anyTest as TestFn<{
  app: FastifyInstance;
}>;

const HTML_PAGE = "<html><body><h1>Hello World</h1></body></html>";
const EXPECTED_PDF_LENGTH = 11696;

test.before(async (t) => {
  const app = await createApp(
    { logger: false },
    getTestConfig({ ENABLE_AUTHENTICATION: false }),
  );

  t.context = {
    // @ts-ignore: createApp returns a type extended with TypeBoxTypeProvider
    app,
  };
});

test.after(async (t) => {
  const { app } = t.context;
  await app.close();
});

test("GET '/api/v1/render' returns not found", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/render",
  });

  t.is(response.statusCode, 404);
});

test("POST '/api/v1/render' renders A4 PDF", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("pdf"));
  t.is(base64regex.test(body.pdf), true);
  t.is(
    Math.floor(0.9 * EXPECTED_PDF_LENGTH) < body.pdf.length &&
      Math.ceil(1.1 * EXPECTED_PDF_LENGTH) > body.pdf.length,
    true,
  );
});

test("POST '/api/v1/render' accepts configuration", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
      format: PageFormats.A5,
      landscape: true,
      background: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      js: true,
      delay: 0,
      scale: 1.0,
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("pdf"));
  t.is(base64regex.test(body.pdf), true);
  t.is(
    Math.floor(0.9 * EXPECTED_PDF_LENGTH) < body.pdf.length &&
      Math.ceil(1.1 * EXPECTED_PDF_LENGTH) > body.pdf.length,
    true,
  );
});

test("POST '/api/v1/render' accepts size", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
      size: {
        width: "10cm",
        height: "10cm",
      },
    },
  });

  const body = response.json();
  t.is(response.statusCode, 200);
  t.assert(body.hasOwnProperty("pdf"));
  t.is(base64regex.test(body.pdf), true);
  t.is(
    Math.floor(0.9 * EXPECTED_PDF_LENGTH) < body.pdf.length &&
      Math.ceil(1.1 * EXPECTED_PDF_LENGTH) > body.pdf.length,
    true,
  );
});

test("POST '/api/v1/render' validates format", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
      format: "B5",
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    code: "FST_ERR_VALIDATION",
    statusCode: 400,
    error: "Bad Request",
    message:
      "body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must be equal to constant, body/format must match a schema in anyOf",
  });
});

test("POST '/api/v1/render' validates delay", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
      delay: 20000,
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    code: "FST_ERR_VALIDATION",
    statusCode: 400,
    error: "Bad Request",
    message: "body/delay must be <= 10000",
  });
});

test("POST '/api/v1/render' validates scale", async (t) => {
  const { app } = t.context;

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/render",
    payload: {
      html: HTML_PAGE,
      scale: 5.0,
    },
  });

  t.is(response.statusCode, 400);
  t.deepEqual(response.json(), {
    code: "FST_ERR_VALIDATION",
    statusCode: 400,
    error: "Bad Request",
    message: "body/scale must be <= 2",
  });
});
