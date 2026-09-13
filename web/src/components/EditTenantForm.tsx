"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TenantIdFields } from "@/components/TenantIdFields";
import { Modal } from "@/components/Modal";

export function EditTenantForm(props: {
  id: string;
  fullName: string;
  phone: string | null;
  phoneSecondary: string | null;
  idType: string | null;
  idNumber: string | null;
  notes: string | null;
  isActive?: boolean;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(props.fullName);
  const [phone, setPhone] = useState(props.phone || "");
  const [phoneSecondary, setPhoneSecondary] = useState(props.phoneSecondary || "");
  const [idType, setIdType] = useState(props.idType || "");
  const [idNumber, setIdNumber] = useState(props.idNumber || "");
  const [notes, setNotes] = useState(props.notes || "");
  const [isActive, setIsActive] = useState(props.isActive !== false);
  const [open, setOpen] = useState(false);
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
        className="min-h-12 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm"
        onClick={() => setOpen(true)}
      >
        Edit info
      </button>
      <Modal open={open} onClose={close} title="Edit tenant" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/tenants", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: props.id,
                fullName,
                phone,
                phoneSecondary,
                idType,
                idNumber,
                notes,
                isActive,
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
            <label className="label">Full name</label>
            <input
              className="field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Second phone</label>
              <input
                className="field"
                placeholder="Second phone"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
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
            <input className="field" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-garawol-mist px-4 py-3 text-sm font-semibold text-garawol-ink">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5"
            />
            Active on the tenants list
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
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
