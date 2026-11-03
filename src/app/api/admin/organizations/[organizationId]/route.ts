import { NextResponse } from "next/server";
import { adminSession } from "@/lib/admin-api";
import { badRequest, readJson } from "@/lib/http";
import {
  PaymentNotFound,
  PaymentRefused,
  setCustomOperatorLimit,
  setOrganizationActive,
} from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/**
 * The two org controls a Super Admin may use (A20): deactivate/reactivate, and set the limit on a
 * Custom contract. A Basic/Pro limit is the price table, not a form field, so it is refused here
 * rather than quietly allowed to disagree with `plans.ts`.
 *
 * Deactivation writes `Organization.isActive = false` and nothing else — no file, no transaction,
 * no operator row is touched (audit history stays intact).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  const admin = await adminSession();
  if (!admin.ok) return badRequest(admin.message, admin.status);

  const parsedBody = await readJson(request);
  if (!parsedBody.ok) return badRequest(UI.common.badJson);
  const body = parsedBody.body as { isActive?: unknown; operatorLimit?: unknown } | null;

  const { organizationId } = await params;

  try {
    if (typeof body?.isActive === "boolean") {
      await setOrganizationActive(organizationId, body.isActive);
    }
    if (body?.operatorLimit !== undefined) {
      const limit = Number(body.operatorLimit);
      if (!Number.isInteger(limit) || limit < 1) return badRequest(UI.adm.orgLimitRequired);
      await setCustomOperatorLimit(organizationId, limit);
    }
    if (body?.isActive === undefined && body?.operatorLimit === undefined) {
      return badRequest(UI.common.invalidInput);
    }
    return NextResponse.json({ ok: true, message: UI.adm.orgLimitSaved });
  } catch (error) {
    if (error instanceof PaymentNotFound) return NextResponse.json({}, { status: 404 });
    if (error instanceof PaymentRefused) return badRequest(UI.common.invalidInput, 409);
    console.error("Admin organization update error:", error);
    return badRequest(UI.adm.errGeneric, 500);
  }
}
