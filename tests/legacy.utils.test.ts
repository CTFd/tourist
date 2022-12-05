import test from "ava";
import { camelizeLegacyActions } from "../src/utils/legacy/actions";

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
