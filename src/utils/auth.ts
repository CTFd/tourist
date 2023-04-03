import url from "url";
import jwt from "jsonwebtoken";

import config from "../config";

export const getIssuerToken = (secret: string): string => {
  const payload = {
    master: true,
  };

  return jwt.sign(payload, secret);
};

export const extractToken = (header: string): string | false => {
  const parts = header.trim().split(" ");

  if (parts.length !== 2) {
    return false;
  }

  if (parts[0].toLowerCase() !== "bearer") {
    return false;
  }

  return parts[1];
};
export const authenticateIssuerToken = (header: string): boolean => {
  if (config.SECRET.trim() === "") {
    return false;
  }

  const token = extractToken(header);
  if (token === false) {
    return false;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.SECRET);
  } catch (e) {
    // token is invalid
    return false;
  }

  if (typeof payload === "object") {
    if (payload.hasOwnProperty("master")) {
      if (payload.master === true) {
        // token is a valid master / issuer token
        return true;
      }
    }
  }

  // token is valid, but not a master / issuer token
  return false;
};

export const getBaseHost = (u: string): string | null => {
  const hostname = url.parse(u).hostname;
  if (!hostname) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length > 2) {
    return parts.slice(parts.length - 2).join(".");
  }

  return hostname;
};

export const authenticateVisitToken = (
  header: string,
  visitURLs: string[],
): boolean => {
  if (config.SECRET.trim() === "") {
    return false;
  }

  const token = extractToken(header);
  if (token === false) {
    return false;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.SECRET);
  } catch (e) {
    return false;
  }

  if (typeof payload === "object") {
    if (payload.hasOwnProperty("scope") && typeof payload.scope === "string") {
      const strict = !!payload.strict;

      if (strict) {
        for (const visitURL of visitURLs) {
          // visit url is not exactly the same as url defined in scope
          if (visitURL !== payload.scope) {
            return false;
          }
        }

        // visit url is exactly the same as url defined in scope
        return true;
      }

      for (const visitURL of visitURLs) {
        // visited host is not the same as host defined in scope
        if (getBaseHost(visitURL) !== getBaseHost(payload.scope)) {
          return false;
        }
      }

      // visited host is the same as host defined in scope
      return true;
    }
  }

  return false;
};
