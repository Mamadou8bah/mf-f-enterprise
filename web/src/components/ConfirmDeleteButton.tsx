"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function ConfirmDeleteButton({
  label = "Delete",
  title,
  description,
  endpoint,
  method = "DELETE",
  body,
  redirectTo,
  className,
}: {
  label?: string;
  title: string;
  description: string;
  endpoint: string;
  method?: "DELETE" | "POST";
  body?: Record<string, unknown>;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
        className={
          className ||
          "inline-flex min-h-12 items-center justify-center rounded-full bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800"
        }
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <Modal open={open} onClose={close} title={title} description={description} size="sm" preventClose={loading}>
        <div className="space-y-4">
          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-red-800 px-4 py-3 text-base font-semibold text-white sm:w-auto sm:px-8"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                const res = await fetch(endpoint, {
                  method,
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(body || {}),
                });
                const data = await res.json().catch(() => ({}));
                setLoading(false);
                if (!res.ok) {
                  setError(data.error || "Could not delete");
                  return;
                }
                setOpen(false);
                if (redirectTo) router.push(redirectTo);
                else router.refresh();
              }}
            >
              {loading ? "Deleting…" : "Delete"}
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
