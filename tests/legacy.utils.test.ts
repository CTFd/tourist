import test from "ava";
import { camelizeLegacyActions } from "../src/utils/legacy/actions";
import { validateLegacyActions } from "../src/utils/legacy/validation";

test("camelizeLegacyActions converts snake_case to camelCase when necessary", (t) => {
  t.deepEqual(camelizeLegacyActions(["page.goto('https://example.com')"]), [
    "page.goto('https://example.com')",
  ]);
  t.deepEqual(camelizeLegacyActions(["page.wait_for_timeout(5000)"]), [
    "page.waitForTimeout(5000)",
  ]);
  t.deepEqual(camelizeLegacyActions(["page.on('alert', alert => alert.dismiss())"]), [
    "page.on('alert', alert => alert.dismiss())",
  ]);
  t.deepEqual(camelizeLegacyActions(["page.wait_for_load_state()"]), [
    "page.waitForLoadState()",
  ]);
  t.deepEqual(camelizeLegacyActions(['page.fill("input[name=username]", "admin")']), [
    'page.fill("input[name=username]", "admin")',
  ]);
});

test("camelizeLegacyActions skips conversion if it cannot be done", (t) => {
  t.deepEqual(camelizeLegacyActions(["pge.wait_for_timeout(5000)"]), [
    "pge.wait_for_timeout(5000)",
  ]);
  t.deepEqual(camelizeLegacyActions(["page.; page.wait_for_timeout(5000)"]), [
    "page.; page.wait_for_timeout(5000)",
  ]);
});

test("validateLegacyActions validates that actions start with page", (t) => {
  // test individual strings
  t.is(
    validateLegacyActions([
      { url: "https://example.com", actions: ["page.goto('https://example.com')"] },
    ]),
    true,
  );
  t.is(
    validateLegacyActions([
      { url: "https://example.com", actions: ["page.waitForTimeout(1000)"] },
    ]),
    true,
  );
  t.is(
    validateLegacyActions([
      { url: "https://example.com", actions: ["page.wait_for_timeout(1000)"] },
    ]),
    true,
  );
  t.is(
    validateLegacyActions([
      {
        url: "https://example.com",
        actions: ["page.on('dialog', dialog => dialog.close())"],
      },
    ]),
    true,
  );

  // test all at once work too
  t.is(
    validateLegacyActions([
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
    validateLegacyActions([
      { url: "https://example.com", actions: ["pge.goto('https://example.com')"] },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
    },
  );

  t.deepEqual(
    validateLegacyActions([
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
    validateLegacyActions([
      { url: "https://example.com", actions: ["goto('https://example.com')"] },
    ]),
    {
      statusCode: 400,
      error: "Action validation failed",
      message: `invalid action "goto('https://example.com')" - does not start with "page."`,
    },
  );

  t.deepEqual(
    validateLegacyActions([
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
    validateLegacyActions([
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
    validateLegacyActions([
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
    validateLegacyActions([
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
