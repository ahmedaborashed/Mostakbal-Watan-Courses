import { z, ZodSchema } from "zod";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Validates request data against a Zod schema.
 * Throws HttpsError('invalid-argument') with detailed error messages on failure.
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => `${err.path.join(".")}: ${err.message}`).join(", ");
    throw new HttpsError("invalid-argument", `البيانات المدخلة غير صحيحة: ${errorMessages}`);
  }
  return result.data;
}
