import _ from "lodash";

// the job of this function is to perform basic validation of the code, and to provide an explicit error message within normal usage
// this is not a security mechanism, security is handled by the context isolation
export const validateLegacyActions = (actions: string[]): boolean => {
  for (const action of actions) {
    if (!action.startsWith("page.")) {
      throw new Error(`invalid action "${action}" - does not start with "page."`);
    }

    if (!(action.endsWith(")") || action.endsWith(");"))) {
      throw new Error(`invalid action "${action}" - does not end with ")" or ");"`);
    }
  }

  return true;
};

// the job of this function is to convert actions from snake_case to camelCase with arguments
// legacy api utilized python playwright, hence functions used to be in snake_case
// it is not bulletproof, and will only convert simple, single line statements, which should be all that's needed
export const camelizeLegacyActions = (actions: string[]): string[] => {
  const camelizedActions = [] as string[];

  for (const action of actions) {
    const parts = /^page\.([0-9a-zA-Z_]*?)\((.*)\)$/g.exec(action);

    if (!parts) {
      // if the conversion can't be done, attempt to run this code either way
      // might fail during execution
      camelizedActions.push(action);
      continue;
    }

    const [input, oldMethodName, args] = parts;
    const methodName = _.camelCase(oldMethodName);
    const newAction = `page.${methodName}(${args})`;
    camelizedActions.push(newAction);
  }

  return camelizedActions;
};
