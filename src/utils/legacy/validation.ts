import _ from "lodash";
import { JobStepType } from "../../schemas/jobs";

// perform basic preliminary validation of the payload to maximize the chances of it running
// it is not a security mechanism, security is handled by the context isolation
export const validateLegacyActions = (steps: JobStepType[]) => {
  // create a flat array of actions from all the steps
  const actions = _.reduce(
    steps,
    (accumulator, step) => {
      if (step.actions) {
        accumulator.push(...step.actions);
      }
      return accumulator;
    },
    [] as string[],
  );

  for (const action of actions) {
    if (!action.startsWith("page.")) {
      return {
        statusCode: 400,
        error: "Action validation failed",
        message: `invalid action "${action}" - does not start with "page."`,
      };
    }

    if (!(action.endsWith(")") || action.endsWith(");"))) {
      return {
        statusCode: 400,
        error: "Action validation failed",
        message: `invalid action "${action}" - does not end with ")" or ");"`,
      };
    }
  }

  return true;
};
