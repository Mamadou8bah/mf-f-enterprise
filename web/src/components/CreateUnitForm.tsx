"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function CreateUnitForm({
  propertyId,
  properties,
}: {
  propertyId?: string;
  properties?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [propId, setPropId] = useState(propertyId || properties?.[0]?.id || "");
  const [code, setCode] = useState("");
  const [type, setType] = useState("shop");
  const [asking, setAsking] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function close() {
    if (loading) return;
    setOpen(false);
    setError("");
  }

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + Add vacant unit
      </button>
      <Modal open={open} onClose={close} title="Add vacant unit" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/units", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                propertyId: propId,
                code,
                type,
                askingRentGmd: asking ? Number(asking) : null,
              }),
            });
            const data = await res.json();
            setLoading(false);
            if (!res.ok) {
              setError(data.error || "Failed");
              return;
            }
            setCode("");
            setAsking("");
            setOpen(false);
            router.refresh();
          }}
        >
          {!propertyId && properties && (
            <div>
              <label className="label">Property</label>
              <select className="field" value={propId} onChange={(e) => setPropId(e.target.value)}>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Unit code</label>
            <input
              className="field"
              placeholder="e.g. Shop 12"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
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
            <label className="label">Asking rent (optional)</label>
            <input
              className="field"
              placeholder="Asking rent"
              inputMode="numeric"
              value={asking}
              onChange={(e) => setAsking(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Add unit"}
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
