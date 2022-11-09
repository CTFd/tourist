import test from "ava";
import { createApp } from "../src/app";

test("test '/' endpoint", async t => {
  const app = await createApp({ logger: false });

  const response = await app.inject({
    method: "GET",
    url: "/",
  });

  t.is(response.statusCode, 200);
  t.deepEqual(response.json(), { hello: "world" });
});
