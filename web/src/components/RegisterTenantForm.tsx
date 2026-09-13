"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { TenantIdFields } from "@/components/TenantIdFields";
import { Modal } from "@/components/Modal";

export type VacantUnitOption = {
  id: string;
  label: string;
  askingRent?: number | null;
};

export function RegisterTenantForm({
  redirectTo,
  defaultOpen = false,
  vacantUnits = [],
  hideTrigger = false,
  triggerClassName,
}: {
  redirectTo?: boolean;
  defaultOpen?: boolean;
  vacantUnits?: VacantUnitOption[];
  /** Hide the + Register button (e.g. mobile — use Quick actions instead) */
  hideTrigger?: boolean;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [unitId, setUnitId] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [deposit, setDeposit] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const assigning = Boolean(unitId);

  function reset() {
    setFullName("");
    setPhone("");
    setPhoneSecondary("");
    setIdType("");
    setIdNumber("");
    setNotes("");
    setUnitId("");
    setAmount("");
    setPeriod("monthly");
    setDeposit("");
    setStartDate(new Date().toISOString().slice(0, 10));
    setNextDue(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  function pickUnit(id: string) {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    setAmount(unit?.askingRent != null ? String(unit.askingRent) : "");
  }

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          className={clsx("btn-primary", triggerClassName)}
          onClick={() => setOpen(true)}
        >
          + Register tenant
        </button>
      )}
      <Modal
        open={open}
        onClose={close}
        title="Register tenant"
        description="Name and phone, then pick a vacant unit if you have one"
        preventClose={loading}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            try {
              if (assigning) {
                const rent = Number(amount);
                if (!Number.isFinite(rent) || rent <= 0) {
                  throw new Error("Enter the rent amount");
                }
                const res = await fetch("/api/tenancies", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    unitId,
                    amountGmd: rent,
                    period,
                    depositGmd: deposit ? Number(deposit) : null,
                    startDate,
                    nextDue,
                    newTenant: { fullName, phone, phoneSecondary, idType, idNumber, notes },
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed");
                reset();
                setOpen(false);
                if (redirectTo) router.push(`/tenants/${data.tenantId}`);
                else router.refresh();
              } else {
                const res = await fetch("/api/tenants", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fullName,
                    phone,
                    phoneSecondary,
                    idType,
                    idNumber,
                    notes,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed");
                reset();
                setOpen(false);
                if (redirectTo) router.push(`/tenants/${data.id}`);
                else router.refresh();
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label className="label">Full name</label>
            <input
              className="field"
              placeholder="e.g. Adama Jallow"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input
                className="field"
                placeholder="Optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
              />
            </div>
            <div>
              <label className="label">Second phone</label>
              <input
                className="field"
                placeholder="Optional"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
                inputMode="tel"
              />
            </div>
          </div>
          <TenantIdFields
            idType={idType}
            idNumber={idNumber}
            onIdTypeChange={setIdType}
            onIdNumberChange={setIdNumber}
          />
          <div>
            <label className="label">Notes</label>
            <input
              className="field"
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-3 border-t border-garawol-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
              Vacancy
            </p>
            {vacantUnits.length === 0 ? (
              <p className="text-sm text-garawol-muted">
                No vacant units on file. Save the tenant now and assign a unit later.
              </p>
            ) : (
              <>
                <div>
                  <label className="label">Assign to unit</label>
                  <select className="field" value={unitId} onChange={(e) => pickUnit(e.target.value)}>
                    <option value="">Don’t assign yet</option>
                    {vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                {assigning && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Rent (GMD)</label>
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
                        placeholder="0"
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
                  </>
                )}
              </>
            )}
          </div>

          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : assigning ? "Save & occupy unit" : "Save tenant"}
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
