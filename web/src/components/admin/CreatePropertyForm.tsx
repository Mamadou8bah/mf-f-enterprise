"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Modal } from "@/components/Modal";

const NEW_LANDLORD = "__new__";

export function CreatePropertyForm({
  landlords,
  defaultOpen = false,
  redirectOnSave = false,
  canClose = true,
}: {
  landlords: { id: string; name: string }[];
  defaultOpen?: boolean;
  redirectOnSave?: boolean;
  canClose?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState("");
  const [landlordId, setLandlordId] = useState(landlords[0]?.id || NEW_LANDLORD);
  const [newLandlord, setNewLandlord] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("mixed");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addingLandlord = landlordId === NEW_LANDLORD || landlords.length === 0;
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
    if (saving || !canClose) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1220] px-4 py-4 text-base font-semibold text-white sm:min-h-12 sm:w-auto sm:rounded-full"
      >
        + Add property
      </button>
      <Modal
        open={open}
        onClose={close}
        title="New property"
        description="Name, owner, and type"
        preventClose={saving || !canClose}
      >
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
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), landlordId: ownerId, area: area.trim(), type }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Could not save property");
              setName("");
              setArea("");
              setNewLandlord("");
              setLandlordPhone("");
              setOpen(false);
              if (redirectOnSave && data.id) {
                router.push(`/properties/${data.id}/round`);
              } else {
                router.refresh();
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <label className="label">Property name</label>
            <input
              className="field"
              placeholder="e.g. Tunkara Plaza 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Landlord</label>
            {landlords.length > 0 && (
              <select className="field" value={landlordId} onChange={(e) => setLandlordId(e.target.value)}>
                {landlords.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
                <option value={NEW_LANDLORD}>+ New landlord</option>
              </select>
            )}
            {addingLandlord && (
              <div className={landlords.length > 0 ? "mt-3 space-y-3" : "space-y-3"}>
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
            <input
              className="field"
              placeholder="e.g. Latrikunda"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
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
          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save property"}
            </button>
            {canClose && (
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={close} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
