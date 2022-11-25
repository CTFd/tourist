import test from "ava";
import { camelizeLegacyActions, validateLegacyActions } from "../src/utils/legacy";

test("validateLegacyActions validates that actions start with page", t => {
  // test individual strings
  t.is(validateLegacyActions(["page.goto('https://example.com')"]), true);
  t.is(validateLegacyActions(["page.waitForTimeout(1000)"]), true);
  t.is(validateLegacyActions(["page.wait_for_timeout(1000)"]), true);
  t.is(validateLegacyActions(["page.on('dialog', dialog => dialog.close())"]), true);

  // test all at once work too
  t.is(
    validateLegacyActions([
      "page.goto('https://example.com')",
      "page.waitForTimeout(1000)",
      "page.wait_for_timeout(1000)",
      "page.on('dialog', dialog => dialog.close())",
    ]),
    true,
  );

  const err_1 = t.throws(() => {
    validateLegacyActions(["pge.goto('https://example.com')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_1.message,
    `invalid action "pge.goto('https://example.com')" - does not start with "page."`,
  );

  const err_2 = t.throws(() => {
    validateLegacyActions(["p.on('dialog', dialog => dialog.close())"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_2.message,
    `invalid action "p.on('dialog', dialog => dialog.close())" - does not start with "page."`,
  );

  const err_3 = t.throws(() => {
    validateLegacyActions(["goto('https://example.com')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_3.message,
    `invalid action "goto('https://example.com')" - does not start with "page."`,
  );

  const err_4 = t.throws(() => {
    validateLegacyActions(["require('child_process')"]);
  });
  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_4.message,
    `invalid action "require('child_process')" - does not start with "page."`,
  );
});

test("validateLegacyActions throws if any actions are invalid", t => {
  // test single failure
  const err_1 = t.throws(() => {
    validateLegacyActions([
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
    validateLegacyActions([
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

test("validateLegacyActions validates that actions end with ) or );", t => {
  // test individual strings
  t.is(validateLegacyActions(["page.goto('https://example.com')"]), true);
  t.is(validateLegacyActions(["page.waitForTimeout(1000)"]), true);
  t.is(validateLegacyActions(["page.wait_for_timeout(1000)"]), true);
  t.is(validateLegacyActions(["page.on('dialog', dialog => dialog.close())"]), true);
  t.is(validateLegacyActions(["page.goto('https://example.com');"]), true);
  t.is(validateLegacyActions(["page.waitForTimeout(1000);"]), true);
  t.is(validateLegacyActions(["page.wait_for_timeout(1000);"]), true);
  t.is(validateLegacyActions(["page.on('dialog', dialog => dialog.close());"]), true);

  // test all at once work too
  t.is(
    validateLegacyActions([
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
    validateLegacyActions(["page.goto('https://example.com'"]);
  });

  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_1.message,
    `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
  );

  const err_2 = t.throws(() => {
    validateLegacyActions(["page.goto('https://example.com'"]);
  });

  t.is(
    // @ts-ignore: test will fail before if error is not thrown
    err_2.message,
    `invalid action "page.goto('https://example.com'" - does not end with ")" or ");"`,
  );
});

test("camelizeLegacyActions converts snake_case to camelCase when necessary", t => {
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

test("camelizeLegacyActions skips conversion if it cannot be done", t => {
  t.deepEqual(camelizeLegacyActions(["pge.wait_for_timeout(5000)"]), [
    "pge.wait_for_timeout(5000)",
  ]);
  t.deepEqual(camelizeLegacyActions(["page.; page.wait_for_timeout(5000)"]), [
    "page.; page.wait_for_timeout(5000)",
  ]);
});
