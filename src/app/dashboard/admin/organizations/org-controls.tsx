"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/ui-strings";

/**
 * §16 org controls. The limit field only exists for a Custom contract: a Basic/Pro limit is the
 * price table (`plans.ts`), and an editable field there would let the console disagree with what
 * the customer paid for. Deactivation is confirmed in the owner's words, because "nonaktifkan"
 * alone reads like deletion and an admin who hesitates leaves a non-paying org with access.
 */
export function OrgControls({
  organizationId,
  isActive,
  isCustom,
  operatorLimit,
}: {
  organizationId: string;
  isActive: boolean;
  isCustom: boolean;
  operatorLimit: number | null;
}) {
  const router = useRouter();
  const [limit, setLimit] = useState(operatorLimit === null ? "" : String(operatorLimit));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(body: { isActive?: boolean; operatorLimit?: number }) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? UI.adm.errGeneric);
        return;
      }
      setMessage(data.message ?? UI.adm.orgLimitSaved);
      router.refresh();
    } catch {
      setError(UI.adm.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    const confirmed = window.confirm(
      isActive ? UI.adm.orgDeactivateConfirm : UI.adm.orgActivateConfirm
    );
    if (confirmed) void send({ isActive: !isActive });
  }

  return (
    <div className="space-y-2">
      {isCustom ? (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`limit-${organizationId}`}>
            {UI.adm.orgLimit}
          </label>
          <input
            id={`limit-${organizationId}`}
            className="w-16 rounded-md border px-2 py-1 text-sm"
            inputMode="numeric"
            value={limit}
            onChange={(event) => setLimit(event.target.value.replace(/[^0-9]/g, ""))}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              const value = Number(limit);
              if (!Number.isInteger(value) || value < 1) {
                setError(UI.adm.orgLimitRequired);
                return;
              }
              void send({ operatorLimit: value });
            }}
          >
            {UI.adm.orgLimitSave}
          </Button>
        </div>
      ) : null}
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={toggle}>
        {isActive ? UI.adm.orgDeactivate : UI.adm.orgActivate}
      </Button>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
