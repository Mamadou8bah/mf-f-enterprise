"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function EditUnitForm({
  unit,
}: {
  unit: {
    id: string;
    code: string;
    type: string;
    status: string;
    askingRentGmd: number | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(unit.code);
  const [type, setType] = useState(unit.type);
  const [status, setStatus] = useState(unit.status);
  const [asking, setAsking] = useState(unit.askingRentGmd != null ? String(unit.askingRentGmd) : "");
  const [notes, setNotes] = useState(unit.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm"
        onClick={() => setOpen(true)}
      >
        Edit unit
      </button>
      <Modal open={open} onClose={close} title="Edit unit" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/units", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: unit.id,
                code,
                type,
                status,
                askingRentGmd: asking ? Number(asking) : null,
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
            <label className="label">Unit code</label>
            <input className="field" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="shop">Shop</option>
              <option value="apartment">Apartment</option>
              <option value="office">Office</option>
              <option value="room_parlour">Room/parlour</option>
              <option value="canteen">Canteen</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="family_free">Family free</option>
              <option value="unknown_rent">Unknown rent</option>
            </select>
          </div>
          <div>
            <label className="label">Asking rent</label>
            <input
              className="field"
              inputMode="numeric"
              value={asking}
              onChange={(e) => setAsking(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
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
