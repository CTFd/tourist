import config from "./config";
import { getIssuerToken } from "./utils/auth";

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "get-issuer-token":
    console.log(getIssuerToken(config.SECRET));
    break;

  default:
    console.log(`Invalid command '${cmd}'`);
    process.exit(1);
}
