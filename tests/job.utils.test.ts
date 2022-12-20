import test from "ava";
import { validateActions } from "../src/utils/validation";

test("validateLegacyActions validates that actions start with page", (t) => {
  // test individual strings
  t.is(
    validateActions([
      { url: "https://example.com", actions: ["page.goto('https://example.com')"] },
    ]),
    true,
  );
  t.is(
    validateActions([
      { url: "https://example.com", actions: ["page.waitForTimeout(1000)"] },
    ]),
    true,
  );
  t.is(
    validateActions([
      { url: "https://example.com", actions: ["page.wait_for_timeout(1000)"] },
    ]),
    true,
  );
  t.is(
    validateActions([
      {
        url: "https://example.com",
        actions: ["page.on('dialog', dialog => dialog.close())"],
      },
    ]),
    true,
  );

  // test all at once work too
  t.is(
    validateActions([
      {
        url: "https://example.com",
        actions: [
          "page.goto('https://example.com')",
          "page.waitForTimeout(1000)",
          "page.wait_for_timeout(1000)",
          "page.on('dialog', dialog => dialog.close())",
        ],
      },
    ]),
    true,
  );

  t.deepEqual(
    validateActions([
      { url: "https://example.com", actions: ["pge.goto('https://example.com')"] },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
    },
  );

  t.deepEqual(
    validateActions([
      {
        url: "https://example.com",
        actions: ["p.on('dialog', dialog => dialog.close())"],
      },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "p.on('dialog', dialog => dialog.close())" - does not start with "page."`,
    },
  );

  t.deepEqual(
    validateActions([
      { url: "https://example.com", actions: ["goto('https://example.com')"] },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "goto('https://example.com')" - does not start with "page."`,
    },
  );

  t.deepEqual(
    validateActions([
      { url: "https://example.com", actions: ["require('child_process')"] },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "require('child_process')" - does not start with "page."`,
    },
  );
});

test("validateActions throws if any actions are invalid", (t) => {
  // test single failure
  t.deepEqual(
    validateActions([
      {
        url: "https://example.com",
        actions: [
          "page.goto('https://example.com')",
          "page.waitForTimeout(1000)",
          "page.wait_for_timeout(1000)",
          "page.on('dialog', dialog => dialog.close())",
          "pge.goto('https://example.com')",
        ],
      },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
    },
  );

  // test multiple failures: first one should be returned
  t.deepEqual(
    validateActions([
      {
        url: "https://example.com",
        actions: [
          "page.goto('https://example.com')",
          "page.waitForTimeout(1000)",
          "page.wait_for_timeout(1000)",
          "page.on('dialog', dialog => dialog.close())",
          "pge.goto('https://example.com')",
          "p.on('dialog', dialog => dialog.close())",
        ],
      },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
    },
  );
});

test("validateActions validates that actions end with ) or );", (t) => {
  t.deepEqual(
    validateActions([
      {
        url: "https://example.com",
        actions: ["page.goto('https://example.com'"],
      },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
    },
  );
});
