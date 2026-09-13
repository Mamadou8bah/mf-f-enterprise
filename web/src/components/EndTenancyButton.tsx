"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function EndTenancyButton({
  tenancyId,
  tenantName,
}: {
  tenancyId: string;
  tenantName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
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
        className="rounded-full bg-garawol-claySoft px-4 py-2 text-sm font-semibold text-garawol-goldInk"
        onClick={() => setOpen(true)}
      >
        Move out
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Move out?"
        description={`${tenantName} will leave this unit. It becomes vacant.`}
        size="sm"
        preventClose={loading}
      >
        <div className="space-y-4">
          <input
            className="field"
            placeholder="Reason / notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0B1220] px-4 py-3 text-base font-semibold text-white sm:w-auto sm:px-8"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                const res = await fetch("/api/tenancies", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: tenancyId, action: "end", notes }),
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
              {loading ? "Ending…" : "Confirm move-out"}
            </button>
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={close} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
