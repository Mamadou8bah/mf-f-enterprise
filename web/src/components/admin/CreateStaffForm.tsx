"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";

export function CreateStaffForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        + Add secretary
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Add secretary"
        description="Desk sign-in for payments and receipts"
        preventClose={loading}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/admin/staff", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fullName,
                email,
                password,
                role: "collector",
              }),
            });
            setLoading(false);
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              setError(data.error || "Failed");
              return;
            }
            setFullName("");
            setEmail("");
            setPassword("");
            setOpen(false);
            router.refresh();
          }}
        >
          <div>
            <label className="label">Full name</label>
            <input
              className="field"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button className="btn-primary w-full sm:w-auto sm:px-8" type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save account"}
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
