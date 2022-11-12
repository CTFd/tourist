import test from "ava";
import { createApp } from "../src/app";

test("GET '/api/healthcheck' returns OK", async t => {
  const app = await createApp({ logger: false });

  const response = await app.inject({
    method: "GET",
    url: "/api/healthcheck",
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { status: "OK" });
});
