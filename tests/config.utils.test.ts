import test from "ava";
import { parseBool } from "../src/utils/config";

test("parseBool correctly parses true values", (t) => {
  t.is(parseBool("TRUE"), true);
  t.is(parseBool("True"), true);
  t.is(parseBool("true"), true);
  t.is(parseBool("ON"), true);
  t.is(parseBool("On"), true);
  t.is(parseBool("on"), true);
  t.is(parseBool("Yes"), true);
  t.is(parseBool("yes"), true);
  t.is(parseBool("1"), true);
});

test("parseBool correctly parses false values", (t) => {
  t.is(parseBool("FALSE"), false);
  t.is(parseBool("False"), false);
  t.is(parseBool("false"), false);
  t.is(parseBool("OFF"), false);
  t.is(parseBool("Off"), false);
  t.is(parseBool("off"), false);
  t.is(parseBool("NO"), false);
  t.is(parseBool("No"), false);
  t.is(parseBool("no"), false);
  t.is(parseBool("0"), false);
  t.is(parseBool("whatever"), false);
  t.is(parseBool(""), false);
});

test("parseBool correctly returns fallback value", (t) => {
  t.is(parseBool(undefined), false);
  t.is(parseBool(undefined, true), true);
});
