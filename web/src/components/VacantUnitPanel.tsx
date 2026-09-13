"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { TenantIdFields } from "@/components/TenantIdFields";
import { Modal } from "@/components/Modal";

type TenantOption = { id: string; label: string };

export function VacantUnitPanel(props: {
  unitId: string;
  tenants?: TenantOption[];
  defaultAsking?: number | null;
  blurb: string;
}) {
  const router = useRouter();
  const existing = props.tenants || [];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [tenantId, setTenantId] = useState(existing[0]?.id || "");
  const [amount, setAmount] = useState(
    props.defaultAsking != null ? String(props.defaultAsking) : ""
  );
  const [period, setPeriod] = useState("monthly");
  const [deposit, setDeposit] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  function resetForm() {
    setOpen(false);
    setMode("new");
    setFullName("");
    setPhone("");
    setPhoneSecondary("");
    setIdType("");
    setIdNumber("");
    setTenantNotes("");
    setError("");
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-garawol-line bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-garawol-line px-5 py-4 lg:px-6">
        <div>
          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
            Vacant
          </span>
          <p className="mt-2 text-sm text-garawol-muted">
            Empty unit — add the new tenant and rent details to occupy it.
          </p>
        </div>
        <Link
          href="/documents/vacancy"
          className="shrink-0 text-sm font-semibold text-garawol-muted hover:text-garawol-green"
        >
          All vacancies
        </Link>
      </div>

      <div className="space-y-4 px-5 py-5 lg:px-6">
        <button
          type="button"
          className="min-h-12 w-full rounded-full bg-[#0B1220] px-5 py-3 text-sm font-semibold text-white sm:w-auto"
          onClick={() => setOpen(true)}
        >
          Place a tenant
        </button>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <CopyButton text={props.blurb} label="Copy listing blurb" variant="link" />
        </div>
      </div>

      <Modal open={open} onClose={close} title="Place a tenant" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const payload: Record<string, unknown> = {
              unitId: props.unitId,
              amountGmd: Number(amount),
              period,
              depositGmd: deposit ? Number(deposit) : null,
              startDate,
              nextDue,
            };
            if (mode === "new") {
              payload.newTenant = {
                fullName,
                phone,
                phoneSecondary,
                idType,
                idNumber,
                notes: tenantNotes,
              };
            } else {
              payload.tenantId = tenantId;
            }
            const res = await fetch("/api/tenancies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
              setError(data.error || "Failed");
              return;
            }
            resetForm();
            router.refresh();
          }}
        >
          {mode === "new" ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
                Tenant details
              </p>
              <input
                className="field"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  className="field"
                  placeholder="Second phone (optional)"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                />
              </div>
              <TenantIdFields
                idType={idType}
                idNumber={idNumber}
                onIdTypeChange={setIdType}
                onIdNumberChange={setIdNumber}
              />
              <input
                className="field"
                placeholder="Notes (optional)"
                value={tenantNotes}
                onChange={(e) => setTenantNotes(e.target.value)}
              />
              {existing.length > 0 && (
                <button
                  type="button"
                  className="text-sm font-semibold text-garawol-green hover:underline"
                  onClick={() => setMode("existing")}
                >
                  Or pick someone already on file
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
                Existing tenant
              </p>
              <select
                className="field"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                {existing.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-sm font-semibold text-garawol-green hover:underline"
                onClick={() => setMode("new")}
              >
                Enter a new tenant instead
              </button>
            </div>
          )}

          <div className="space-y-3 border-t border-garawol-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
              Rent terms
            </p>
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
                  <option value="3_months">3 months</option>
                  <option value="6_months">6 months</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save & occupy unit"}
            </button>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={close} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
