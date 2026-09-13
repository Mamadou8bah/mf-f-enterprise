"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";

const NEW_LANDLORD = "__new__";

export function EditPropertyForm({
  property,
  landlords,
}: {
  property: {
    id: string;
    name: string;
    landlordId: string;
    area: string | null;
    type: string;
    notes: string | null;
  };
  landlords: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(property.name);
  const [landlordId, setLandlordId] = useState(property.landlordId);
  const [newLandlord, setNewLandlord] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [area, setArea] = useState(property.area || "");
  const [type, setType] = useState(property.type || "mixed");
  const [notes, setNotes] = useState(property.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addingLandlord = landlordId === NEW_LANDLORD;
  const typeOptions = useMemo(
    () =>
      [
        ["mixed", "Building"],
        ["plaza", "Plaza"],
        ["market", "Market"],
        ["residential", "House"],
      ] as const,
    []
  );

  function close() {
    if (saving) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm"
      >
        Edit property
      </button>
      <Modal open={open} onClose={close} title="Edit property" preventClose={saving}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError("");
            try {
              let ownerId = landlordId;
              if (addingLandlord) {
                const landlordName = newLandlord.trim();
                if (!landlordName) throw new Error("Enter the landlord name");
                const lr = await fetch("/api/admin/landlords", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fullName: landlordName, phone: landlordPhone.trim() }),
                });
                const landlord = await lr.json();
                if (!lr.ok) throw new Error(landlord.error || "Could not save landlord");
                ownerId = landlord.id;
              }
              const res = await fetch("/api/admin/properties", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: property.id,
                  name: name.trim(),
                  landlordId: ownerId,
                  area: area.trim(),
                  type,
                  notes: notes.trim(),
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Could not save");
              setOpen(false);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <label className="label">Property name</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Landlord</label>
            <select className="field" value={landlordId} onChange={(e) => setLandlordId(e.target.value)}>
              {landlords.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              <option value={NEW_LANDLORD}>+ New landlord</option>
            </select>
            {addingLandlord && (
              <div className="mt-3 space-y-3">
                <input
                  className="field"
                  placeholder="Landlord full name"
                  value={newLandlord}
                  onChange={(e) => setNewLandlord(e.target.value)}
                  required={addingLandlord}
                />
                <input
                  className="field"
                  placeholder="Phone (optional)"
                  value={landlordPhone}
                  onChange={(e) => setLandlordPhone(e.target.value)}
                />
              </div>
            )}
          </div>
          <div>
            <label className="label">Area / location</label>
            <input className="field" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={
                    type === id
                      ? "min-h-12 rounded-2xl bg-[#0B1220] px-3 py-3 text-sm font-semibold text-white"
                      : "min-h-12 rounded-2xl bg-garawol-mist px-3 py-3 text-sm font-semibold text-garawol-ink"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={close} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
