/**
 * Bank account for the manual-transfer screen (A20).
 *
 * Read from env on the server only — the numbers are never written into a component, a seed
 * or a test. Missing or blank env returns null, and the screen then offers only the WhatsApp
 * path: a half-filled account block is worse than no account block.
 */
export type BankAccount = { bankName: string; accountNumber: string; accountName: string };

const PLACEHOLDER = "0000000000";

export function bankAccountFromEnv(
  env: Record<string, string | undefined> = process.env
): BankAccount | null {
  const bankName = env.BANK_NAME?.trim();
  const accountNumber = env.BANK_ACCOUNT_NUMBER?.trim();
  const accountName = env.BANK_ACCOUNT_NAME?.trim();
  if (!bankName || !accountNumber || !accountName) return null;
  // .env.example ships zeros; rendering them as a real account would send money nowhere.
  if (accountNumber === PLACEHOLDER) return null;
  return { bankName, accountNumber, accountName };
}
