import test from "ava";
import { createApp } from "../src/app";

test("GET '/openapi.json' returns the specification", async t => {
  const app = await createApp({ logger: false });

  const response = await app.inject({
    method: "GET",
    url: "/openapi.json",
  });

  t.is(response.statusCode, 200);
  t.snapshot(response.json());
});
