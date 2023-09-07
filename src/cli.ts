import config from "./config";
import { getIssuerToken } from "./utils/auth";
import { parseBool } from "./utils/config";
import jwt from "jsonwebtoken";

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "get-issuer-token":
    console.log(getIssuerToken(config.SECRET));
    break;

  case "get-visit-token":
    const scope = args[1];
    const validity = parseInt(args[2]) || 3600;
    const strict = parseBool(args[3]);

    const payload = {
      scope,
      strict,
    };

    console.log(jwt.sign(payload, config.SECRET, { expiresIn: validity }));
    break;

  default:
    console.log(`Invalid command '${cmd}'`);
    process.exit(1);
}
