"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function VoidReceiptButton({ receiptId }: { receiptId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
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
        className="btn-secondary text-red-700"
        disabled={loading}
        onClick={() => setOpen(true)}
      >
        Void
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Void this receipt?"
        description="This cannot be undone. Enter a reason for the office file."
        size="sm"
        preventClose={loading}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = reason.trim();
            if (!trimmed) {
              setError("Enter a reason");
              return;
            }
            setLoading(true);
            setError("");
            const res = await fetch("/api/receipts/void", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receiptId, reason: trimmed }),
            });
            setLoading(false);
            if (!res.ok) {
              setError((await res.text()) || "Failed");
              return;
            }
            setOpen(false);
            router.refresh();
          }}
        >
          <div>
            <label className="label">Reason</label>
            <input
              className="field"
              placeholder="Why is this receipt void?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-red-800 px-4 py-3 text-base font-semibold text-white sm:w-auto sm:px-8"
              disabled={loading}
            >
              {loading ? "Voiding…" : "Void receipt"}
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
