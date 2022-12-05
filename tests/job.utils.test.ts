import test from "ava";
import { validateActions } from "../src/utils/validation";

test("validateLegacyActions validates that actions start with page", (t) => {
  // test individual strings
  t.is(validateActions(["page.goto('https://example.com')"]), true);
  t.is(validateActions(["page.waitForTimeout(1000)"]), true);
  t.is(validateActions(["page.wait_for_timeout(1000)"]), true);
  t.is(validateActions(["page.on('dialog', dialog => dialog.close())"]), true);

  // test all at once work too
  t.is(
    validateActions([
      "page.goto('https://example.com')",
      "page.waitForTimeout(1000)",
      "page.wait_for_timeout(1000)",
      "page.on('dialog', dialog => dialog.close())",
    ]),
    true,
  );

  const err_1 = t.throws(() => {
    validateActions(["pge.goto('https://example.com')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_1.message,
    `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
  );

  const err_2 = t.throws(() => {
    validateActions(["p.on('dialog', dialog => dialog.close())"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_2.message,
    `invalid action "p.on('dialog', dialog => dialog.close())" - does not start with "page."`,
  );

  const err_3 = t.throws(() => {
    validateActions(["goto('https://example.com')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_3.message,
    `invalid action "goto('https://example.com')" - does not start with "page."`,
  );

  const err_4 = t.throws(() => {
    validateActions(["require('child_process')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_4.message,
    `invalid action "require('child_process')" - does not start with "page."`,
  );
});

test("validateLegacyActions throws if any actions are invalid", (t) => {
  // test single failure
  const err_1 = t.throws(() => {
    validateActions([
      "page.goto('https://example.com')",
      "page.waitForTimeout(1000)",
      "page.wait_for_timeout(1000)",
      "page.on('dialog', dialog => dialog.close())",
      "pge.goto('https://example.com')",
    ]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_1.message,
    `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
  );

  // test multiple failures: first one should be returned
  const err_2 = t.throws(() => {
    validateActions([
      "page.goto('https://example.com')",
      "page.waitForTimeout(1000)",
      "page.wait_for_timeout(1000)",
      "page.on('dialog', dialog => dialog.close())",
      "pge.goto('https://example.com')",
      "p.on('dialog', dialog => dialog.close())",
    ]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_2.message,
    `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
  );
});

test("validateLegacyActions validates that actions end with ) or );", (t) => {
  // test individual strings
  t.is(validateActions(["page.goto('https://example.com')"]), true);
  t.is(validateActions(["page.waitForTimeout(1000)"]), true);
  t.is(validateActions(["page.wait_for_timeout(1000)"]), true);
  t.is(validateActions(["page.on('dialog', dialog => dialog.close())"]), true);
  t.is(validateActions(["page.goto('https://example.com');"]), true);
  t.is(validateActions(["page.waitForTimeout(1000);"]), true);
  t.is(validateActions(["page.wait_for_timeout(1000);"]), true);
  t.is(validateActions(["page.on('dialog', dialog => dialog.close());"]), true);

  // test all at once work too
  t.is(
    validateActions([
      "page.goto('https://example.com')",
      "page.waitForTimeout(1000)",
      "page.wait_for_timeout(1000)",
      "page.on('dialog', dialog => dialog.close())",
      "page.goto('https://example.com');",
      "page.waitForTimeout(1000);",
      "page.wait_for_timeout(1000);",
      "page.on('dialog', dialog => dialog.close());",
    ]),
    true,
  );

  const err_1 = t.throws(() => {
    validateActions(["page.goto('https://example.com'"]);
  });

  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_1.message,
    `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
  );

  const err_2 = t.throws(() => {
    validateActions(["page.goto('https://example.com'"]);
  });

  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_2.message,
    `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
  );
});
