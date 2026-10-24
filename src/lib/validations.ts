import { z } from "zod";

/**
 * Registration input.
 * Text fields are trimmed before validation so whitespace-only input is
 * rejected (BUG-04); every field has a readable "required" message (BUG-06);
 * email is normalised to lowercase so one person cannot hold two accounts (BUG-03).
 */
export const registerSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(1, "Name is required"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
  // Not trimmed: spaces inside a password are legitimate. Blank passwords are not.
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .refine((value) => value.trim().length > 0, "Password must not be blank"),
  organizationName: z
    .string({ error: "Organization name is required" })
    .trim()
    .min(1, "Organization name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/** Same normalisation as registration so login lookups match stored emails. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
