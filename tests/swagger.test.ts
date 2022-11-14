import * as fs from "fs";
import * as path from "path";

import test from "ava";
import { createApp } from "../src/app";

test("createApp creates openapi.json", async t => {
  const openapi = path.resolve(__dirname, "..", "static", "openapi.json");
  if (openapi) {
    fs.rmSync(openapi);
  }

  const app = await createApp({ logger: false });
  const response = await app.inject({
    method: "GET",
    url: "/openapi.json",
  });

  t.is(response.statusCode, 200);
  t.snapshot(response.json());
});

test("GET '/openapi.json' returns the specification", async t => {
  const app = await createApp({ logger: false });

  const response = await app.inject({
    method: "GET",
    url: "/openapi.json",
  });

  t.is(response.statusCode, 200);
  t.snapshot(response.json());
});
