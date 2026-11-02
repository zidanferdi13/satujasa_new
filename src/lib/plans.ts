/**
 * Subscription plans (TDD, PM-locked). Prices are whole rupiah, never floats.
 * Ids mirror the Prisma `Package` enum, kept as a plain union so this module can be
 * imported by client components without pulling the Prisma runtime into the bundle.
 * Display formatting is NOT done here: use formatRupiah() (src/lib/money.ts) in the UI.
 */
export type PlanId = "BASIC" | "PRO" | "CUSTOM";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number | null; // null = negotiated (CUSTOM)
  operatorLimit: number | null; // null = negotiated (CUSTOM)
  checkout: boolean; // can be bought from the subscribe screen (manual transfer, A20)
  featured: boolean;
};

export const PLANS = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceMonthly: 99000,
    operatorLimit: 1,
    checkout: true,
    featured: false,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 249000,
    operatorLimit: 3,
    checkout: true,
    featured: true,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom",
    priceMonthly: null,
    operatorLimit: null,
    checkout: false,
    featured: false,
  },
} as const satisfies Record<PlanId, Plan>;

/** Display order: cheapest first, CUSTOM last. */
export const PLAN_LIST: readonly Plan[] = [PLANS.BASIC, PLANS.PRO, PLANS.CUSTOM];

export function planById(id: string): Plan | undefined {
  return PLAN_LIST.find((plan) => plan.id === id);
}
