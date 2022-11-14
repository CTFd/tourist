import * as fs from "fs";
import * as path from "path";

import anyTest, { TestFn } from "ava";
import { createApp } from "../src/app";

const test = anyTest as TestFn<{
  staticPath: string;
}>;

test.before(async t => {
  t.context = {
    staticPath: "./test-static",
  };
});

test.afterEach(async t => {
  const { staticPath } = t.context;

  if (fs.existsSync(staticPath)) {
    fs.rmSync(staticPath, { recursive: true, force: true });
  }
});

test("createApp accepts static directory configuration option", async t => {
  const { staticPath } = t.context;
  fs.mkdirSync(path.resolve(staticPath));

  await createApp({ logger: false }, { staticPath });

  t.assert(fs.existsSync(path.resolve(staticPath)));
});

test("createApp creates default static directory if not exists", async t => {
  const defaultStaticPath = path.resolve(path.join(__dirname, "..", "static"));
  fs.rmSync(defaultStaticPath, { recursive: true, force: true });

  await createApp({ logger: false });

  t.assert(fs.existsSync(defaultStaticPath));
});
