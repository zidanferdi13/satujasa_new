import { z } from "zod";

/**
 * Text fields are trimmed before validation so whitespace-only input is
 * rejected (BUG-04); every field has a readable "required" message (BUG-06);
 * email is normalised to lowercase so one person cannot hold two accounts (BUG-03).
 */
const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Invalid email address");

// Not trimmed: spaces inside a password are legitimate. Blank passwords are not.
const passwordField = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .refine((value) => value.trim().length > 0, "Password must not be blank");

const nameField = z.string({ error: "Name is required" }).trim().min(1, "Name is required");

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  organizationName: z
    .string({ error: "Organization name is required" })
    .trim()
    .min(1, "Organization name is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({
  token: z.string({ error: "Reset token is required" }).trim().min(1, "Reset token is required"),
  password: passwordField,
});

/** Owner creates an operator login. The owner sets the initial password and hands it over. */
export const createOperatorSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

/** Same normalisation as registration so login lookups match stored emails. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
