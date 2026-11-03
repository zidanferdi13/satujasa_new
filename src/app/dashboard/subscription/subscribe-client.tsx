"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/landing/pricing-cards";
import { formatRupiah } from "@/lib/money";
import { planById, type PlanId } from "@/lib/plans";
import { MAX_RECEIPT_BYTES } from "@/lib/payment-limits";
import type { BankAccount } from "@/lib/payment-bank";
import { paymentWhatsAppUrl, rejectionWhatsAppUrl } from "@/lib/whatsapp";
import { UI } from "@/lib/ui-strings";

export type SubscribePayment = {
  id: string;
  code: string;
  amount: number;
  package: string;
  status: "UNPAID" | "WAITING_VERIFICATION" | "PAID" | "REJECTED";
  rejectionReason: string | null;
};

type Props = { payment: SubscribePayment | null; bank: BankAccount | null };

/** §15 state A: the locked heading, the two promise lines, and the cards that start a payment. */
function PlanChooser({ onSelect, busy }: { onSelect: (plan: PlanId) => void; busy: boolean }) {
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">{UI.sub.title}</h1>
      <p className="text-muted-foreground mb-1">{UI.sub.body}</p>
      {/* A21: place 1 of 3 — same two keys as the FAQ and the Terms page. */}
      <p className="text-muted-foreground mb-1">{UI.promise.core}</p>
      <p className="text-muted-foreground mb-1">{UI.promise.weekend}</p>
      <p className="text-muted-foreground mb-8">{UI.sub.operatorNote}</p>
      <h2 className="text-xl font-semibold mb-4">{UI.sub.planHeading}</h2>
      <PricingCards onSelect={(plan) => (busy ? undefined : onSelect(plan))} />
    </div>
  );
}

/**
 * One upload control for state B and state D (A20: a rejection is re-uploaded against the same
 * payment, never a second order). The size check runs here so an obviously oversized file does
 * not travel; the server re-checks, because the browser's answer is not evidence.
 */
function ReceiptUpload({ paymentId, label }: { paymentId: string; label: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function send(file: File) {
    setError(null);
    setDone(null);
    if (file.size > MAX_RECEIPT_BYTES) {
      setError(UI.up.tooBig);
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("receipt", file);
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        method: "POST",
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        setError(data.error ?? UI.up.failed);
        return;
      }
      setDone(data.message ?? UI.up.done);
      router.refresh();
    } catch {
      setError(UI.up.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="mt-4">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
        }}
      />
      <Button type="button" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? UI.up.sending : label}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{UI.pay.uploadHint}</p>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {done ? <p className="mt-2 text-sm text-emerald-700">{done}</p> : null}
    </div>
  );
}

/** §15 state B: bank details, the code in the transfer note, then proof. */
function PayPanel({
  payment,
  bank,
  onChangePlan,
}: {
  payment: SubscribePayment;
  bank: BankAccount | null;
  onChangePlan: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const planName = planById(payment.package)?.name ?? payment.package;
  const amount = formatRupiah(payment.amount);

  async function copyAccount() {
    if (!bank) return;
    try {
      await navigator.clipboard.writeText(bank.accountNumber);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-1">{UI.pay.title}</h1>
      <p className="text-muted-foreground mb-6">{planName}</p>

      <div className="p-6 border rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">{UI.pay.codeLabel}</p>
        <p className="font-mono text-2xl font-bold tracking-wide">{payment.code}</p>
        <p className="mt-1 text-sm text-muted-foreground">{UI.pay.codeHelp}</p>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{UI.pay.amountLabel}</p>
          <p className="text-2xl font-semibold">{amount}</p>
        </div>

        {bank ? (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{UI.pay.bankLabel}</p>
            <p className="font-medium">
              {bank.bankName} · {bank.accountNumber}
            </p>
            <p className="text-sm text-muted-foreground">{UI.pay.accountName(bank.accountName)}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={copyAccount}>
              {UI.pay.copy}
            </Button>
            {copied ? (
              <p className="mt-1 text-xs text-emerald-700" role="status">
                {UI.pay.copied}
              </p>
            ) : null}
          </div>
        ) : (
          // A20: never a blank account field. With no bank env, WhatsApp is the only path.
          <p className="mt-4 text-sm text-rose-600">{UI.pay.bankMissing}</p>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{UI.pay.steps}</p>

      <ReceiptUpload paymentId={payment.id} label={UI.pay.uploadCta} />

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">{UI.pay.waHelp}</p>
        <a
          className="text-sm underline"
          href={paymentWhatsAppUrl(payment.code, planName, amount)}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            // The WhatsApp path is a real confirmation (A20): it moves the row to WAITING_VERIFICATION.
            void fetch(`/api/payments/${payment.id}/whatsapp`, { method: "POST" });
          }}
        >
          {UI.pay.waCta}
        </a>
      </div>

      <div className="mt-8">
        <Button type="button" variant="ghost" size="sm" onClick={onChangePlan}>
          {UI.pay.changePlan}
        </Button>
      </div>
    </div>
  );
}

/** §15 state C. Only PAID grants access, so waiting has to be said plainly. */
function WaitingPanel({ payment }: { payment: SubscribePayment }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-2">{UI.verify.waitTitle}</h1>
      <p className="text-muted-foreground mb-1">{UI.verify.waitBody}</p>
      <p className="text-muted-foreground mb-1">{UI.promise.core}</p>
      <p className="text-muted-foreground mb-4">{UI.promise.weekend}</p>
      <p className="font-mono text-sm mb-1">{UI.verify.waitCode(payment.code)}</p>
      <p className="text-sm text-muted-foreground">{UI.verify.waitLocked}</p>
    </div>
  );
}

/** §15 state D: the admin's reason verbatim, same payment, re-upload. */
function RejectedPanel({ payment }: { payment: SubscribePayment }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold mb-2">{UI.verify.rejTitle}</h1>
      <div className="p-4 border rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">{UI.verify.rejReasonLabel}</p>
        <p className="font-medium">{payment.rejectionReason ?? ""}</p>
      </div>
      <p className="text-muted-foreground mb-1">{UI.verify.rejBody}</p>
      <p className="font-mono text-sm mb-4">{UI.verify.rejCode(payment.code)}</p>
      <ReceiptUpload paymentId={payment.id} label={UI.verify.rejReupload} />
      <div className="mt-4">
        <a
          className="text-sm underline"
          href={rejectionWhatsAppUrl(payment.code)}
          target="_blank"
          rel="noreferrer"
        >
          {UI.verify.rejWa}
        </a>
      </div>
    </div>
  );
}

export function SubscribeClient({ payment, bank }: Props) {
  const router = useRouter();
  const [choosing, setChoosing] = useState(payment === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(plan: PlanId) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? UI.common.genericError);
        return;
      }
      setChoosing(false);
      router.refresh();
    } catch {
      setError(UI.common.genericError);
    } finally {
      setBusy(false);
    }
  }

  if (choosing || !payment) {
    return (
      <>
        <PlanChooser onSelect={start} busy={busy} />
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </>
    );
  }

  if (payment.status === "WAITING_VERIFICATION") return <WaitingPanel payment={payment} />;
  if (payment.status === "REJECTED") return <RejectedPanel payment={payment} />;
  return <PayPanel payment={payment} bank={bank} onChangePlan={() => setChoosing(true)} />;
}
