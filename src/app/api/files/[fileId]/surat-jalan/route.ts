import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { activeSeatFor } from "@/lib/seat-guard";
import { buildSuratJalan } from "@/lib/surat-jalan";
import { UI } from "@/lib/ui-strings";

/**
 * The printable Surat Jalan for one file (A23: full NIK).
 *
 * Same boundaries as every other file route: the tenant comes from the session, the id alone is
 * never enough, and an operator may only print their own file. A seat is required — printing the
 * customer's KTP is a write-shaped act even though nothing is written.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const session = await auth();
  const organizationId = session?.user?.organizationId;
  if (!session?.user || !organizationId) return badRequest(UI.common.notSignedIn, 401);

  const seat = await activeSeatFor(session.user.id, organizationId);
  if (!seat) return badRequest(UI.seat.readOnly, 403);

  const { fileId } = await params;
  const file = await prisma.file.findFirst({
    where: { id: fileId, organizationId },
    select: {
      id: true,
      customerName: true,
      customerKtp: true,
      vehicleNumber: true,
      ownershipType: true,
      serviceType: true,
      notes: true,
      operatorId: true,
      pickedUpAt: true,
      createdAt: true,
      operator: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });
  // Cross-tenant and cross-operator ids are the same answer: it is not there.
  if (!file) return NextResponse.json({}, { status: 404 });
  if (session.user.role === "OPERATOR" && file.operatorId !== seat.id) {
    return NextResponse.json({}, { status: 404 });
  }

  const pdf = await buildSuratJalan({
    organizationName: file.organization.name,
    operatorName: file.operator.name,
    customerName: file.customerName,
    customerKtp: file.customerKtp,
    vehicleNumber: file.vehicleNumber,
    serviceType: file.serviceType,
    ownershipTypeLabel: UI.ownership[file.ownershipType],
    notes: file.notes,
    createdAt: file.createdAt,
    pickedUpAt: file.pickedUpAt,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      // inline: the browser previews it, which is what a print button should do.
      "content-disposition": `inline; filename="surat-jalan-${file.id}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
