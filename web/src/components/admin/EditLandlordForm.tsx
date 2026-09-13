"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function EditLandlordForm({
  landlord,
}: {
  landlord: {
    id: string;
    fullName: string;
    phone: string | null;
    phoneSecondary: string | null;
    email: string | null;
    displayTitle: string | null;
    notes: string | null;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(landlord.fullName);
  const [phone, setPhone] = useState(landlord.phone || "");
  const [phoneSecondary, setPhoneSecondary] = useState(landlord.phoneSecondary || "");
  const [email, setEmail] = useState(landlord.email || "");
  const [displayTitle, setDisplayTitle] = useState(landlord.displayTitle || "");
  const [notes, setNotes] = useState(landlord.notes || "");
  const [isActive, setIsActive] = useState(landlord.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-garawol-ink shadow-sm"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>
      <ConfirmDeleteButton
        label="Delete"
        title="Delete landlord?"
        description="Only works if they own no properties."
        endpoint="/api/admin/landlords"
        body={{ id: landlord.id }}
        className="rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
      />
      <Modal open={open} onClose={close} title="Edit landlord" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/admin/landlords", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: landlord.id,
                fullName,
                phone,
                phoneSecondary,
                email,
                displayTitle,
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
            <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Title</label>
            <input className="field" value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Phone</label>
              <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Second phone</label>
              <input className="field" value={phoneSecondary} onChange={(e) => setPhoneSecondary(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-garawol-mist px-4 py-3 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5" />
            Active
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
    </div>
  );
}
