"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatJakartaDate } from "@/lib/date-format";
import { UI } from "@/lib/ui-strings";

/**
 * §16 verification. `adm.verifyConfirm` states the outcome before it happens — plan and end date —
 * because a click here grants access to a paying customer, and the admin should see the
 * consequence rather than discover it on the next screen.
 *
 * Rejection needs a reason in the admin's own words: it is the customer's only explanation.
 */
export function PaymentActions({
  paymentId,
  planName,
  amountLabel,
  periodEndIso,
}: {
  paymentId: string;
  planName: string;
  amountLabel: string;
  periodEndIso: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    const confirmed = window.confirm(
      UI.adm.verifyConfirm(planName, formatJakartaDate(new Date(periodEndIso)))
    );
    if (!confirmed) return;
    setBusy("verify");
    setError(null);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string; currentPeriodEnd?: string };
      if (!response.ok) {
        setError(data.error ?? UI.adm.errGeneric);
        return;
      }
      router.refresh();
    } catch {
      setError(UI.adm.errGeneric);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError(UI.adm.rejectReasonRequired);
      return;
    }
    setBusy("reject");
    setError(null);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? UI.adm.errGeneric);
        return;
      }
      router.refresh();
    } catch {
      setError(UI.adm.errGeneric);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 border rounded-lg">
      <p className="text-sm text-muted-foreground mb-4">{amountLabel}</p>
      <div className="flex gap-3">
        <Button type="button" disabled={busy !== null} onClick={verify}>
          {UI.adm.verify}
        </Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => setRejecting((v) => !v)}>
          {UI.adm.reject}
        </Button>
      </div>

      {rejecting ? (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" htmlFor="rejection-reason">
            {UI.adm.rejectReasonLabel}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(UI.rr).map(([key, value]) => (
              <Button key={key} type="button" size="sm" variant="outline" onClick={() => setReason(value)}>
                {value}
              </Button>
            ))}
          </div>
          <textarea
            id="rejection-reason"
            className="w-full rounded-md border p-2 text-sm"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <Button type="button" className="mt-2" disabled={busy !== null} onClick={reject}>
            {UI.adm.rejectSend}
          </Button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
