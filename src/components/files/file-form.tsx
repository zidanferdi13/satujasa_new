"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UI } from "@/lib/ui-strings";
import { formatRupiah } from "@/lib/money";
import { formatJakartaDate } from "@/lib/date-format";
import { FILE_STATUSES, TERMINAL_STATUSES, computeMoney, transitionRefusal } from "@/lib/file-rules";
import { OWNERSHIP_TYPES, SERVICE_TYPES, fileInputSchema } from "@/lib/file-input";

export type FileFormValues = {
  id: string;
  customerName: string;
  customerKtp: string;
  vehicleNumber: string;
  ownershipType: string;
  serviceType: string;
  notes: string | null;
  estimatedPrice: number;
  dpAmount: number;
  finalPrice: number | null;
  samsatPayment: number | null;
  status: string;
  pickedUpAt: string | null;
  createdAt: string;
};

type FormState = {
  customerName: string;
  customerKtp: string;
  vehicleNumber: string;
  ownershipType: string;
  serviceType: string;
  notes: string;
  estimatedPrice: string;
  dpAmount: string;
  finalPrice: string;
  samsatPayment: string;
  status: string;
};

/** Digits only. Returns null for an empty field; NaN for text the schema will refuse. */
function parseMoney(value: string): number | null {
  const digits = value.replace(/[.\s]/g, "");
  if (digits === "") return null;
  if (!/^\d+$/.test(digits)) return Number.NaN;
  return Number(digits);
}

function toFormState(file?: FileFormValues): FormState {
  return {
    customerName: file?.customerName ?? "",
    customerKtp: file?.customerKtp ?? "",
    vehicleNumber: file?.vehicleNumber ?? "",
    ownershipType: file?.ownershipType ?? "PERORANGAN",
    serviceType: file?.serviceType ?? "STNK",
    notes: file?.notes ?? "",
    estimatedPrice: file ? String(file.estimatedPrice) : "",
    dpAmount: file ? String(file.dpAmount) : "",
    finalPrice: file?.finalPrice !== null && file?.finalPrice !== undefined ? String(file.finalPrice) : "",
    samsatPayment:
      file?.samsatPayment !== null && file?.samsatPayment !== undefined ? String(file.samsatPayment) : "",
    status: file?.status ?? "DRAFT",
  };
}

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

/**
 * `basePath` is the list this form returns to: the operator's own files, or the owner's view of the
 * whole organization. Creating is operator-only (M3), so the default is the operator list.
 */
export default function FileForm({
  file,
  basePath = "/dashboard/operator/files",
}: {
  file?: FileFormValues;
  basePath?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(() => toFormState(file));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const isTerminal = file ? TERMINAL_STATUSES.includes(file.status as never) : false;
  const currentStatus = file?.status ?? "DRAFT";

  // Only statuses this file may actually enter: no backward moves, no edit of a frozen row.
  const statusOptions = useMemo(
    () => FILE_STATUSES.filter((status) => transitionRefusal(currentStatus as never, status) === null),
    [currentStatus]
  );

  const preview = useMemo(
    () =>
      computeMoney({
        finalPrice: parseMoney(values.finalPrice) ?? null,
        samsatPayment: parseMoney(values.samsatPayment) ?? null,
      }),
    [values.finalPrice, values.samsatPayment]
  );

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const estimatedPrice = parseMoney(values.estimatedPrice);
    const dpAmount = parseMoney(values.dpAmount);
    const finalPrice = parseMoney(values.finalPrice);
    const samsatPayment = parseMoney(values.samsatPayment);

    // An empty amount is "not yet" only where the column is nullable; a text amount is never ok.
    if (
      estimatedPrice === null ||
      dpAmount === null ||
      Number.isNaN(estimatedPrice) ||
      Number.isNaN(dpAmount) ||
      Number.isNaN(finalPrice) ||
      Number.isNaN(samsatPayment)
    ) {
      setError(UI.file.moneyError);
      return;
    }

    const payload = {
      customerName: values.customerName,
      customerKtp: values.customerKtp,
      vehicleNumber: values.vehicleNumber,
      ownershipType: values.ownershipType,
      serviceType: values.serviceType,
      notes: values.notes.trim() === "" ? null : values.notes,
      estimatedPrice,
      dpAmount,
      finalPrice,
      samsatPayment,
      status: values.status,
    };

    // Same rules the server applies, so the guard message appears before the round trip.
    const parsed = fileInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? UI.common.invalidInput);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(file ? `/api/files/${file.id}` : "/api/files", {
        method: file ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? UI.file.failed);
        return;
      }
      router.push(basePath);
      router.refresh();
    } catch {
      setError(UI.file.failed);
    } finally {
      setLoading(false);
    }
  };

  const requestStatusChange = (next: string) => {
    if (next === "CANCELED") {
      setConfirmingCancel(true);
      return;
    }
    setValues((previous) => ({ ...previous, status: next }));
  };

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-8">
      {isTerminal && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {UI.file.terminalNote}
        </p>
      )}

      <fieldset disabled={isTerminal} className="grid gap-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {UI.file.sectionCustomer}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.customerName}</span>
              <Input value={values.customerName} onChange={set("customerName")} autoComplete="off" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.customerKtp}</span>
              <Input
                value={values.customerKtp}
                onChange={set("customerKtp")}
                inputMode="numeric"
                maxLength={16}
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">{UI.file.customerKtpHelp}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.vehicleNumber}</span>
              <Input value={values.vehicleNumber} onChange={set("vehicleNumber")} autoComplete="off" />
              <span className="text-xs text-muted-foreground">{UI.file.vehicleNumberHelp}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.ownershipType}</span>
              <select className={fieldClass} value={values.ownershipType} onChange={set("ownershipType")}>
                {OWNERSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {UI.ownership[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.serviceType}</span>
              <select className={fieldClass} value={values.serviceType} onChange={set("serviceType")}>
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {UI.service[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.status}</span>
              <select
                className={fieldClass}
                value={values.status}
                onChange={(event) => requestStatusChange(event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {UI.status[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 grid gap-1.5">
            <span className="text-sm font-medium">{UI.file.notes}</span>
            <textarea
              className={`${fieldClass} h-20 py-2`}
              value={values.notes}
              onChange={set("notes")}
              placeholder={UI.file.notesPlaceholder}
            />
          </label>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {UI.file.sectionMoney}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.estimatedPrice}</span>
              <Input
                value={values.estimatedPrice}
                onChange={set("estimatedPrice")}
                inputMode="numeric"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">{UI.file.estimatedPriceHelp}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.dpAmount}</span>
              <Input value={values.dpAmount} onChange={set("dpAmount")} inputMode="numeric" autoComplete="off" />
              <span className="text-xs text-muted-foreground">{UI.file.dpAmountHelp}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.finalPrice}</span>
              <Input value={values.finalPrice} onChange={set("finalPrice")} inputMode="numeric" autoComplete="off" />
              <span className="text-xs text-muted-foreground">{UI.file.finalPriceHelp}</span>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">{UI.file.samsatPayment}</span>
              <Input
                value={values.samsatPayment}
                onChange={set("samsatPayment")}
                inputMode="numeric"
                autoComplete="off"
              />
              <span className="text-xs text-muted-foreground">{UI.file.samsatPaymentHelp}</span>
            </label>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {UI.file.serviceFee}: {preview.serviceFee === null ? "—" : formatRupiah(preview.serviceFee)}
          </p>
        </div>
      </fieldset>

      {confirmingCancel && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm">{UI.file.cancelConfirm}</p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setValues((previous) => ({ ...previous, status: "CANCELED" }));
                setConfirmingCancel(false);
              }}
            >
              {UI.file.cancelConfirmYes}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirmingCancel(false)}>
              {UI.file.cancelConfirmNo}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {file && (
          <span>
            {UI.file.createdAt}: {formatJakartaDate(new Date(file.createdAt))}
          </span>
        )}
        {file?.pickedUpAt && (
          <span>
            {UI.file.pickedUpAt}: {formatJakartaDate(new Date(file.pickedUpAt))}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {!isTerminal && (
          <Button type="submit" disabled={loading}>
            {loading ? UI.file.submitting : file ? UI.file.update : UI.file.submit}
          </Button>
        )}
        <Link
          href={basePath}
          className={buttonVariants({ variant: "outline" })}
        >
          {UI.file.cancel}
        </Link>
      </div>
    </form>
  );
}
