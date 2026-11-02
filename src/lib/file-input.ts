/**
 * Berkas input schema — the single gate between the form and the database (A17).
 *
 * The server computes serviceFee/revenue and stamps pickedUpAt, so none of those fields is
 * accepted from the request. Zod's object schema strips unknown keys by default, which is the
 * enforcement: a body carrying serviceFee, revenue or pickedUpAt loses them here and can never
 * reach prisma.file.create/update.
 *
 * Every message comes from `UI` (docs/ui-strings-id.md), so the form and the API cannot drift.
 */
import { z } from "zod";
import { FILE_STATUSES, pickupRefused } from "./file-rules.ts";
import { UI } from "./ui-strings.ts";

export const OWNERSHIP_TYPES = ["PERORANGAN", "BADAN_USAHA"] as const;
export const SERVICE_TYPES = ["STNK", "PLAT", "MUTASI", "SIM_A", "SIM_B", "SIM_C"] as const;

/** Int32 ceiling for `File.*Price` columns; above this the insert would fail at the database. */
const MAX_RUPIAH = 2_147_483_647;

const money = z
  .number({ error: UI.file.moneyError })
  .int(UI.file.moneyError)
  .min(0, UI.file.moneyError)
  .max(MAX_RUPIAH, UI.file.moneyError);

/** Empty optional money arrives as null and stays null: 0 is a real amount, "not yet" is not. */
const optionalMoney = money.nullish().transform((value) => value ?? null);

export const fileInputSchema = z
  .object({
    customerName: z.string({ error: UI.file.customerNameError }).trim().min(1, UI.file.customerNameError),
    // String, not a number: a 16-digit NIK starts with 0 more often than not (A17).
    customerKtp: z
      .string({ error: UI.file.customerKtpError })
      .trim()
      .regex(/^\d{16}$/, UI.file.customerKtpError),
    vehicleNumber: z
      .string({ error: UI.file.vehicleNumberError })
      .trim()
      .min(1, UI.file.vehicleNumberError),
    ownershipType: z.enum(OWNERSHIP_TYPES, { error: UI.common.invalidInput }),
    serviceType: z.enum(SERVICE_TYPES, { error: UI.common.invalidInput }),
    notes: z
      .string()
      .trim()
      .max(1000, UI.common.invalidInput)
      .nullish()
      .transform((value) => (value ? value : null)),
    estimatedPrice: money,
    dpAmount: money,
    finalPrice: optionalMoney,
    samsatPayment: optionalMoney,
    status: z.enum(FILE_STATUSES, { error: UI.common.invalidInput }),
  })
  .superRefine((value, ctx) => {
    // A fee below zero is never a real job, whatever the status: refuse it before it is cached.
    if (value.finalPrice !== null && value.samsatPayment !== null && value.finalPrice < value.samsatPayment) {
      ctx.addIssue({ code: "custom", path: ["finalPrice"], message: UI.file.pickupGuard });
      return;
    }
    // PICKED_UP additionally requires both amounts to exist (A17).
    if (value.status === "PICKED_UP" && pickupRefused(value)) {
      ctx.addIssue({ code: "custom", path: ["finalPrice"], message: UI.file.pickupGuard });
    }
  });

export type FileInput = z.infer<typeof fileInputSchema>;
