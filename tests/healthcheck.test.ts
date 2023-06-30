import test from "ava";
import { createApp } from "../src/app";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { getTestConfig } from "./utils/_common";

test("GET '/api/v1/healthcheck' returns OK", async (t) => {
  const app = await createApp({ logger: false }, getTestConfig());

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/healthcheck",
  });

  // expect healthcheck to fail with github action workflow
  // as it won't be able to reach example.com
  if (process.env.GH_ACTIONS === "true") {
    t.is(response.statusCode, 500);
    t.deepEqual(response.json(), { status: "FAILING" });
  } else {
    t.is(response.statusCode, 200);
    t.deepEqual(response.json(), { status: "OK" });
  }
});
