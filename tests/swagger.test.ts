import test from "ava";
import { createApp } from "../src/app";
import { getConfig } from "../src/config";

test("GET '/docs/json' returns the specification with legacy API enabled", async (t) => {
  const app = await createApp({ logger: false }, getConfig());

  const response = await app.inject({
    method: "GET",
    url: "/docs/json",
  });

  t.is(response.statusCode, 200);
  t.snapshot(response.json());
});

test("GET '/docs/json' returns the specification with legacy API disabled", async (t) => {
  const app = await createApp(
    { logger: false },
    getConfig({ ENABLE_LEGACY_API: false }),
  );

  const response = await app.inject({
    method: "GET",
    url: "/docs/json",
  });

  t.is(response.statusCode, 200);
  t.snapshot(response.json());
});

test("GET '/' redirects to docs", async (t) => {
  const app = await createApp({ logger: false }, getConfig());

  const response = await app.inject({
    method: "GET",
    url: "/",
  });

  t.is(response.statusCode, 302);
  t.assert(response.headers.hasOwnProperty("location"));
  t.is(response.headers.location, "/docs");
});

test("GET '/docs' displays Swagger UI", async (t) => {
  const app = await createApp({ logger: false }, getConfig());

  const response = await app.inject({
    method: "GET",
    url: "/docs/static/index.html",
  });

  t.is(response.statusCode, 200);
  t.assert(response.body.includes("Swagger UI"));
});
