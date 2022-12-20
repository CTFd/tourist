import test from "ava";
import { parseBool } from "../src/utils/config";

test("parseBool correctly parses true values", (t) => {
  t.is(parseBool("TRUE", false), true);
  t.is(parseBool("True", false), true);
  t.is(parseBool("true", false), true);
  t.is(parseBool("ON", false), true);
  t.is(parseBool("On", false), true);
  t.is(parseBool("on", false), true);
  t.is(parseBool("Yes", false), true);
  t.is(parseBool("yes", false), true);
  t.is(parseBool("1", false), true);
});

test("parseBool correctly parses false values", (t) => {
  t.is(parseBool("FALSE", true), false);
  t.is(parseBool("False", true), false);
  t.is(parseBool("false", true), false);
  t.is(parseBool("OFF", true), false);
  t.is(parseBool("Off", true), false);
  t.is(parseBool("off", true), false);
  t.is(parseBool("NO", true), false);
  t.is(parseBool("No", true), false);
  t.is(parseBool("no", true), false);
  t.is(parseBool("0", true), false);
});

test("parseBool correctly returns fallback value", (t) => {
  t.is(parseBool(undefined), false);
  t.is(parseBool(undefined, true), true);
  t.is(parseBool("whatever"), false);
  t.is(parseBool("whatever", true), true);
  t.is(parseBool(""), false);
  t.is(parseBool("", true), true);
});
