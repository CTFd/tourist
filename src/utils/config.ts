export const parseBool = (
  input: string | undefined,
  fallback: boolean = false,
): boolean => {
  if (input) {
    return ["true", "on", "yes", "1"].includes(input.toLowerCase());
  }

  return fallback;
};
