import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readReceipt } from "@/lib/payment-receipt";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import {
  AlreadyProcessed,
  PaymentNotFound,
  ReceiptTooBig,
  ReceiptUnreadable,
  paymentForOrganization,
  submitReceipt,
} from "@/lib/payments";
import { UI } from "@/lib/ui-strings";

/** §15 state B → C: the owner uploads proof. The body is multipart; the file is the only field. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);
  if (session.user.role !== "OWNER") return badRequest(UI.addop.ownerOnly, 403);

  const { paymentId } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest(UI.common.badJson);
  }
  const upload = form.get("receipt");
  if (!(upload instanceof File)) return badRequest(UI.up.unreadable);

  try {
    await submitReceipt(organizationId, paymentId, new Uint8Array(await upload.arrayBuffer()));
    return NextResponse.json({ ok: true, message: UI.up.done });
  } catch (error) {
    if (error instanceof PaymentNotFound) return NextResponse.json({}, { status: 404 });
    if (error instanceof AlreadyProcessed) return badRequest(UI.adm.alreadyDone, 409);
    if (error instanceof ReceiptTooBig) return badRequest(UI.up.tooBig, 413);
    if (error instanceof ReceiptUnreadable) return badRequest(UI.up.unreadable);
    console.error("Receipt upload error:", error);
    return badRequest(UI.up.failed, 500);
  }
}

/**
 * The only way a receipt is ever read (A20): authorized, never statically served.
 * Owner of the payment's organization, or a Super Admin — nothing else, and no token in the URL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await auth();
  if (!session?.user) return badRequest(UI.common.notSignedIn, 401);
  const { paymentId } = await params;

  const isAdmin = session.user.role === "SUPER_ADMIN";
  const organizationId = session.user.organizationId;
  if (!isAdmin && !organizationId) return badRequest(UI.common.notSignedIn, 401);

  // Tenant scoping by lookup, not by comparing ids after the fact: an id from another org
  // simply does not resolve.
  const payment = isAdmin
    ? await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } })
    : await paymentForOrganization(organizationId as string, paymentId);
  if (!payment?.receiptPath) return NextResponse.json({}, { status: 404 });

  try {
    const bytes = await readReceipt(payment.receiptPath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": payment.receiptMime ?? "application/octet-stream",
        "Content-Disposition": "inline",
        // One customer's bank proof: no shared cache, no CDN copy.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Receipt read error:", error);
    return badRequest(UI.adm.errReceipt, 500);
  }
}
