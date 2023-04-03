import test from "ava";
import jwt from "jsonwebtoken";

import config from "../src/config";

import {
  authenticateIssuerToken,
  authenticateVisitToken,
  extractToken,
  getBaseHost,
  getIssuerToken,
} from "../src/utils/auth";

// @ts-ignore: tests directory is not under rootDir, because we're using ts-node for testing
import { timestamp } from "./utils/_common";

const TEST_SECRET = config.SECRET;
const TEST_TOKEN = jwt.sign(
  {
    scope: "https://example.com",
    strict: false,
    iat: timestamp(),
    exp: timestamp() + 3600,
  },
  TEST_SECRET,
);

const TEST_EXPIRED_TOKEN = jwt.sign(
  {
    scope: "https://example.com",
    strict: false,
    iat: timestamp(),
    exp: timestamp(),
  },
  TEST_SECRET,
);

const TEST_STRICT_TOKEN = jwt.sign(
  {
    scope: "https://example.com",
    strict: true,
    iat: timestamp(),
    exp: timestamp() + 3600,
  },
  TEST_SECRET,
);

const TEST_ISSUER_TOKEN = getIssuerToken(TEST_SECRET);
test("extractToken returns a token from correctly formatted header", async (t) => {
  t.is(extractToken(`Bearer ${TEST_TOKEN}`), TEST_TOKEN);
  t.is(extractToken(`bearer ${TEST_TOKEN}`), TEST_TOKEN);
  t.is(extractToken(`  Bearer ${TEST_TOKEN}  `), TEST_TOKEN);
  t.is(extractToken(` Bearer ${TEST_TOKEN}  `), TEST_TOKEN);
  t.is(
    extractToken(`
    Bearer ${TEST_TOKEN}  
  `),
    TEST_TOKEN,
  );
});

test("extractToken returns false with incorrectly formatted header", async (t) => {
  t.is(extractToken(`${TEST_TOKEN}`), false);
  t.is(extractToken(`Token ${TEST_TOKEN}`), false);
  t.is(extractToken(``), false);
  t.is(extractToken(`Bearer ${TEST_TOKEN} test`), false);
});

test("authenticateIssuerToken returns true if token is a valid issuer token", async (t) => {
  t.is(authenticateIssuerToken(`Bearer ${TEST_ISSUER_TOKEN}`), true);
});

test("authenticateIssuerToken returns false if token could not be extracted", async (t) => {
  t.is(authenticateIssuerToken(`Bearer`), false);
});

test("authenticateIssuerToken returns false if token is invalid", async (t) => {
  t.is(
    authenticateIssuerToken(
      `Bearer eyfpdskfds.invalid-token.sadoiadhasio`,
    ),
    false,
  );
});

test("authenticateIssuerToken returns false if token is not an issuer token", async (t) => {
  t.is(authenticateIssuerToken(`Bearer ${TEST_TOKEN}`), false);
});

test("getBaseHost returns the base host of a given URL", async (t) => {
  t.is(getBaseHost(""), null);
  t.is(getBaseHost("..."), null);

  t.is(getBaseHost("http://example.com"), "example.com");
  t.is(getBaseHost("http://example.com:8080"), "example.com");
  t.is(getBaseHost("http://example.com/test"), "example.com");
  t.is(getBaseHost("http://example.com:8080/test"), "example.com");
  t.is(getBaseHost("http://test.example.com"), "example.com");
  t.is(getBaseHost("http://test.example.com:8080"), "example.com");
  t.is(getBaseHost("http://test.example.com/test"), "example.com");
  t.is(getBaseHost("http://test.example.com:8080/test"), "example.com");

  t.is(getBaseHost("https://example.com"), "example.com");
  t.is(getBaseHost("https://example.com:8443"), "example.com");
  t.is(getBaseHost("https://example.com/test"), "example.com");
  t.is(getBaseHost("https://example.com:8443/test"), "example.com");
  t.is(getBaseHost("https://test.example.com"), "example.com");
  t.is(getBaseHost("https://test.example.com:8443"), "example.com");
  t.is(getBaseHost("https://test.example.com/test"), "example.com");
  t.is(getBaseHost("https://test.example.com:8443/test"), "example.com");

  t.is(getBaseHost("http://test.test.example.com:8080"), "example.com");
  t.is(getBaseHost("https://test.test.example.com:8443"), "example.com");
  t.is(getBaseHost("http://test.test.example.com:8080/test"), "example.com");
  t.is(getBaseHost("https://test.test.example.com:8443/test"), "example.com");
});

test("authenticateVisitToken returns true if token is a valid visit token for given URLs", async (t) => {
  // non-strict token
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com:8443"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(`Bearer ${TEST_TOKEN}`, ["http://example.com"]),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["http://example.com:8000"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.test.example.com"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com:8443"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.test.example.com:8443"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com/test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com:8443/test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com/test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com:8443/test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com:8443?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com/test?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com:8443/test?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com:8443?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com/test?test=test"],
    ),
    true,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example.com:8443/test?test=test"],
    ),
    true,
  );

  // strict token
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://example.com"],
    ),
    true,
  );
});

test("authenticateVisitToken returns false if token could not be extracted", async (t) => {
  t.is(authenticateVisitToken(`Bearer`, ["https://example.com"]), false);
});


test("authenticateVisitToken returns false if token is invalid", async (t) => {
  t.is(
    authenticateVisitToken(
      `Bearer eyfpdskfds.invalid-token.sadoiadhasio`,
      ["https://example.com"]
    ),
    false,
  );
});

test("authenticateVisitToken returns false if token is not valid for all given URLs", async (t) => {
  // non-strict token
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com", "https://example1.com"]
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example.com", "http://example1.com"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example1.com"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example1.com/test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example1.com/test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example1.com?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://example1.com/test?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example1.com?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_TOKEN}`,
      ["https://test.example1.com/test?test=test"],
    ),
    false,
  );

  // strict token
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://example.com", "http://example.com"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://test.example.com"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://example.com/test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://test.example.com/test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://example.com?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://example.com/test?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://test.example.com?test=test"],
    ),
    false,
  );
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_STRICT_TOKEN}`,
      ["https://test.example.com/test?test=test"],
    ),
    false,
  );
});

test("authenticateVisitToken returns false if token is expired", async (t) => {
  t.is(
    authenticateVisitToken(
      `Bearer ${TEST_EXPIRED_TOKEN}`,
      ["https://example.com"],
    ),
    false,
  );
});

test("authenticateVisitToken returns false if token payload is not an object", async (t) => {
  const token = jwt.sign("test", TEST_SECRET);
  t.is(authenticateVisitToken(`Bearer ${token}`, []), false);
});

test("getIssuerToken returns a correct issuer token", async (t) => {
  const issuedToken = getIssuerToken(TEST_SECRET);

  let token;
  t.notThrows(() => {
    token = jwt.verify(issuedToken, TEST_SECRET);
  });

  // @ts-ignore: test won't reach this if jwt.verify fails to get token
  t.is(token.master, true);
});
