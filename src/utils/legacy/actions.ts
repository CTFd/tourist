import _ from "lodash";

// this function converts actions from snake_case to camelCase with copied arguments
// legacy api utilized python playwright, hence functions used to be in snake_case
// it is not bulletproof, and will only convert simple, single line statements, which should be all that's needed
export const camelizeLegacyActions = (actions: string[]): string[] => {
  const camelizedActions = [] as string[];

  for (const action of actions) {
    const parts = /^page\.([0-9a-zA-Z_]*?)\((.*)\)$/g.exec(action);

    if (!parts) {
      // if the conversion can't be done, attempt to pass this code either way
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
