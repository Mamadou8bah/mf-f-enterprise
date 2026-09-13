"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TenantIdFields } from "@/components/TenantIdFields";
import { Modal } from "@/components/Modal";

type TenantOption = { id: string; label: string };

export function OccupyUnitForm(props: {
  unitId: string;
  tenants?: TenantOption[];
  defaultAsking?: number | null;
}) {
  const router = useRouter();
  const existing = props.tenants || [];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [tenantId, setTenantId] = useState(existing[0]?.id || "");
  const [amount, setAmount] = useState(
    props.defaultAsking != null ? String(props.defaultAsking) : ""
  );
  const [period, setPeriod] = useState("monthly");
  const [deposit, setDeposit] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className="min-h-12 w-full rounded-full bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
        onClick={() => setOpen(true)}
      >
        Place a tenant
      </button>
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
            };
            if (mode === "new") {
              payload.newTenant = { fullName, phone, idType, idNumber };
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
            setOpen(false);
            router.refresh();
          }}
        >
          {mode === "new" ? (
            <div className="space-y-3">
              <div>
                <label className="label">Full name</label>
                <input
                  className="field"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="field"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <TenantIdFields
                idType={idType}
                idNumber={idNumber}
                onIdTypeChange={setIdType}
                onIdNumberChange={setIdNumber}
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
              <div>
                <label className="label">Existing tenant</label>
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
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-garawol-green hover:underline"
                onClick={() => setMode("new")}
              >
                Enter a new tenant instead
              </button>
            </div>
          )}
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
    </>
  );
}
