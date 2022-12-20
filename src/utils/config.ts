export const parseBool = (
  input: string | undefined,
  fallback: boolean = false,
): boolean => {
  if (input) {
    if (["true", "on", "yes", "1"].includes(input.toLowerCase())) {
      return true;
    }

    if (["false", "off", "no", "0"].includes(input.toLowerCase())) {
      return false;
    }
  }

  return fallback;
};
