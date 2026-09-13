"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function EditStaffForm({
  staff,
}: {
  staff: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(staff.fullName);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState(staff.role === "admin" ? "admin" : "collector");
  const [isActive, setIsActive] = useState(staff.isActive);
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
        title="Delete office user?"
        description="If they recorded payments, they will be deactivated instead of removed."
        endpoint="/api/admin/staff"
        body={{ id: staff.id }}
        className="rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
      />
      <Modal open={open} onClose={close} title="Edit office user" preventClose={loading}>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError("");
            const res = await fetch("/api/admin/staff", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: staff.id, fullName, email, role, isActive }),
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
            <label className="label">Email</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="collector">Secretary</option>
              <option value="admin">Owner</option>
            </select>
          </div>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-garawol-mist px-4 py-3 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5" />
            Can sign in
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
