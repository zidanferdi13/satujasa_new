import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import {
  buildExportPdf,
  buildWorkbook,
  exportWhere,
  jakartaDayRange,
  type ExportFile,
} from "@/lib/export";
import { UI } from "@/lib/ui-strings";

/**
 * Owner data export (item 9, A12). Owner-only: operators have no export path at all, and a Super
 * Admin has no tenancy to export from.
 *
 * Deliberately NOT behind `organizationIsEntitled`: A12 keeps export open when a subscription
 * lapses — "Data Anda tetap tersimpan dan bisa diekspor" is a promise on the locked screen, and
 * holding the owner's own data hostage would make that copy a lie.
 *
 * Dates are Asia/Jakarta calendar days, inclusive on both ends, because the owner's "1–30
 * November" means their days, not UTC's.
 */

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return badRequest(UI.common.notSignedIn, 401);
  const organizationId = session.user.organizationId;
  if (!organizationId) return new NextResponse(null, { status: 403 });
  // Owner-only. No string: no screen offers this to an operator, so there is nothing to read.
  if (session.user.role !== "OWNER") return new NextResponse(null, { status: 403 });

  const params = new URL(request.url).searchParams;
  const format = params.get("format");
  const fromDay = params.get("from") ?? "";
  const toDay = params.get("to") ?? "";

  // §19: a person picking dates reads this, so it is one sentence about dates rather than
  // `UI.common.invalidInput`'s "something was wrong with the request".
  if (format !== "xlsx" && format !== "pdf") return badRequest(UI.common.invalidInput);
  const range = jakartaDayRange(fromDay, toDay);
  if (!range) return badRequest(UI.exp.errRange);
  const { start: from, end: toExclusive } = range;

  const files = await prisma.file.findMany({
    where: exportWhere(organizationId, { start: from, end: toExclusive }),
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      customerName: true,
      customerKtp: true,
      vehicleNumber: true,
      ownershipType: true,
      serviceType: true,
      status: true,
      finalPrice: true,
      samsatPayment: true,
      serviceFee: true,
      operator: { select: { name: true } },
    },
  });

  const rows: ExportFile[] = files.map((file) => ({
    createdAt: file.createdAt,
    customerName: file.customerName,
    customerKtp: file.customerKtp,
    vehicleNumber: file.vehicleNumber,
    ownershipType: file.ownershipType,
    serviceType: file.serviceType,
    status: file.status,
    operatorName: file.operator.name,
    finalPrice: file.finalPrice,
    samsatPayment: file.samsatPayment,
    serviceFee: file.serviceFee,
  }));

  const filename = `berkas-${fromDay}_${toDay}`;

  if (format === "xlsx") {
    return new NextResponse(new Uint8Array(buildWorkbook(rows)), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}.xlsx"`,
        "cache-control": "no-store",
      },
    });
  }

  const pdf = await buildExportPdf(rows, {
    from,
    // Human-facing end: the last day the range includes, not the exclusive boundary.
    to: new Date(toExclusive.getTime() - 1),
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
