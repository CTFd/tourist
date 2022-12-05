import test from "ava";
import { createApp } from "../src/app";
import { getConfig } from "../src/config";

test("GET '/api/v1/healthcheck' returns OK", async (t) => {
  const app = await createApp({ logger: false }, getConfig());

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/healthcheck",
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "OK" });
});
