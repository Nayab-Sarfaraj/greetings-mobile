import { z } from "zod";
import { ValidationError } from "./errors";
export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new ValidationError(
      result.error.issues.map((issue) => issue.message).join("; "),
    );
  return result.data;
}
