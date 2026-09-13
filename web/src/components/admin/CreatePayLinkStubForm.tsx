"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function CreatePayLinkStubForm({
  tenancies,
}: {
  tenancies: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tenancyId, setTenancyId] = useState(tenancies[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + Create stub
      </button>
      <Modal open={open} onClose={close} title="Create stub" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/admin/pay-links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tenancyId, amountGmd: Number(amount) }),
            });
            setLoading(false);
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              setError(data.error || "Failed");
              return;
            }
            setAmount("");
            setOpen(false);
            router.refresh();
          }}
        >
          <div>
            <label className="label">Tenancy</label>
            <select className="field" value={tenancyId} onChange={(e) => setTenancyId(e.target.value)}>
              {tenancies.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (GMD)</label>
            <input
              className="field"
              placeholder="Amount GMD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save draft stub"}
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
