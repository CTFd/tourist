// perform basic preliminary validation of the payload to maximize the chances of it running
// it is not a security mechanism, security is handled by the context isolation
export const validateActions = (actions: string[]): boolean => {
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
