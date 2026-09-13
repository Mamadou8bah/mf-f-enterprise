"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, formatDate, formatGmd, periodMonths } from "@garawol/shared";
import type { PaymentMethod, RentPeriod } from "@garawol/shared";
import { enqueueOutbox, localReceiptNo } from "@/lib/offline";
import { useSync } from "@/components/SyncProvider";

type Props = {
  tenancyId: string;
  tenantName: string;
  tenantId: string;
  unitCodes: string;
  propertyName: string;
  /** Agreed rent for one billing period */
  amountGmd: number;
  period: RentPeriod;
  /** Suggested period start (next_due or day after last payment end) */
  nextDue: string;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function coverEnd(start: string, months: number) {
  const end = addMonths(new Date(start), months);
  end.setDate(end.getDate() - 1);
  return iso(end);
}

function nextDueAfter(end: string) {
  const d = new Date(end);
  d.setDate(d.getDate() + 1);
  return iso(d);
}

export function QuickPayForm(props: Props) {
  const router = useRouter();
  const sync = useSync();
  const rentPerPeriod = props.amountGmd;
  const monthsPerPeriod = periodMonths(props.period);

  const [periodStart, setPeriodStart] = useState(props.nextDue);
  const [periodEnd, setPeriodEnd] = useState(() =>
    coverEnd(props.nextDue, monthsPerPeriod)
  );
  const [amountInput, setAmountInput] = useState(String(rentPerPeriod));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedEnd = useMemo(
    () => coverEnd(periodStart || props.nextDue, monthsPerPeriod),
    [periodStart, monthsPerPeriod, props.nextDue]
  );

  function applyStart(next: string) {
    setPeriodStart(next);
    if (!next) return;
    setPeriodEnd(coverEnd(next, monthsPerPeriod));
  }

  function resetSuggested() {
    setPeriodStart(props.nextDue);
    setPeriodEnd(coverEnd(props.nextDue, monthsPerPeriod));
    setAmountInput(String(rentPerPeriod));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const amountGmd = Math.round(Number(amountInput));
    if (!amountGmd || amountGmd <= 0) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Choose the period this payment covers");
      setLoading(false);
      return;
    }
    if (periodEnd < periodStart) {
      setError("Period end must be on or after the start date");
      setLoading(false);
      return;
    }

    const payload = {
      tenancyId: props.tenancyId,
      amountGmd,
      method,
      periodStart,
      periodEnd,
      notes,
      localReceiptNo: !sync.online ? localReceiptNo() : undefined,
    };

    try {
      if (!sync.online) {
        await enqueueOutbox({
          type: "payment",
          payload,
          createdAt: new Date().toISOString(),
        });
        await sync.refresh();
        router.push(`/receipts/local?no=${payload.localReceiptNo}&amount=${amountGmd}`);
        return;
      }
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      router.push(`/receipts/${data.receiptId}?print=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const drifted =
    periodStart !== props.nextDue ||
    periodEnd !== suggestedEnd ||
    Number(amountInput) !== rentPerPeriod;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-base font-medium text-garawol-muted">Office counter</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-garawol-ink sm:text-3xl lg:text-3xl">
          Record payment
        </h1>
        <p className="mt-1 text-base text-garawol-muted">
          {props.tenantName} · {props.unitCodes} · {props.propertyName}
        </p>
      </div>

      <div className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-card lg:p-6">
        <div>
          <label className="label" htmlFor="period-start">
            Period they are paying for
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-garawol-soft">From</span>
              <input
                id="period-start"
                className="field"
                type="date"
                value={periodStart}
                onChange={(e) => applyStart(e.target.value)}
                required
              />
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-garawol-soft">To</span>
              <input
                className="field"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-garawol-muted">
            Covers {formatDate(periodStart)} – {formatDate(periodEnd)}. Next due becomes{" "}
            <span className="font-semibold text-garawol-ink">
              {formatDate(nextDueAfter(periodEnd))}
            </span>
            .
          </p>
        </div>

        <div>
          <label className="label" htmlFor="amount">
            Amount received (GMD)
          </label>
          <input
            id="amount"
            className="field text-xl font-bold"
            inputMode="numeric"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Method</label>
          <select
            className="field"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          >
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="rounded-[1.25rem] border border-garawol-line px-4 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-garawol-muted">Covers</dt>
              <dd className="text-right font-semibold text-garawol-ink">
                {formatDate(periodStart)} – {formatDate(periodEnd)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-garawol-muted">Amount</dt>
              <dd className="text-right text-xl font-bold tabular-nums text-garawol-ink">
                {formatGmd(Math.round(Number(amountInput) || 0))}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-garawol-muted">Next due after save</dt>
              <dd className="text-right font-semibold text-garawol-ink">
                {formatDate(nextDueAfter(periodEnd))}
              </dd>
            </div>
          </dl>
        </div>

        {drifted && (
          <button
            type="button"
            className="text-sm font-semibold text-garawol-green hover:underline"
            onClick={resetSuggested}
          >
            Reset to suggested period
          </button>
        )}

        {error && <p className="text-base text-red-700">{error}</p>}
        <button className="btn-primary w-full text-base" disabled={loading} type="submit">
          {loading ? "Saving…" : sync.online ? "Save & print receipt" : "Save offline"}
        </button>
        <a
          href={`/tenants/${props.tenantId}`}
          className="block text-center text-sm font-semibold text-garawol-muted hover:text-garawol-green"
        >
          View all payments for this tenant
        </a>
      </div>
    </form>
  );
}
