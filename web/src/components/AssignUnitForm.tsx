"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

type UnitOption = { id: string; label: string };

export function AssignUnitForm(props: {
  tenantId: string;
  vacantUnits: UnitOption[];
}) {
  const router = useRouter();
  const [unitId, setUnitId] = useState(props.vacantUnits[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [deposit, setDeposit] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  if (props.vacantUnits.length === 0) {
    return (
      <p className="text-sm text-garawol-muted">
        No vacant units available. Add a unit or free one by ending a tenancy.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        className="min-h-12 w-full rounded-full bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
        onClick={() => setOpen(true)}
      >
        + Assign to unit
      </button>
      <Modal open={open} onClose={close} title="Assign unit / start tenancy" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/tenancies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tenantId: props.tenantId,
                unitId,
                amountGmd: Number(amount),
                period,
                depositGmd: deposit ? Number(deposit) : null,
                startDate,
                nextDue,
                notes,
              }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
              setError(data.error || "Failed");
              return;
            }
            setOpen(false);
            router.refresh();
          }}
        >
          <div>
            <label className="label">Vacant unit</label>
            <select className="field" value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
              {props.vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Rent amount (GMD)</label>
              <input
                className="field"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Period</label>
              <select className="field" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="2_months">2 months</option>
                <option value="3_months">3 months</option>
                <option value="6_months">6 months</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Deposit (optional)</label>
            <input
              className="field"
              inputMode="numeric"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Start date</label>
              <input
                className="field"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Next due</label>
              <input
                className="field"
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
              />
            </div>
          </div>
          <input
            className="field"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Start tenancy"}
            </button>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={close} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
