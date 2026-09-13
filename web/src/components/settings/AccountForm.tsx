"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function AccountForm(props: {
  fullName: string;
  phone: string;
  email: string;
  roleLabel: string;
}) {
  const { update } = useSession();
  const [fullName, setFullName] = useState(props.fullName);
  const [phone, setPhone] = useState(props.phone);
  const [email, setEmail] = useState(props.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setOk("");
        try {
          const res = await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullName,
              phone,
              email,
              currentPassword: currentPassword || undefined,
              newPassword: newPassword || undefined,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not save");
          await update({ name: data.fullName, email: data.email });
          setCurrentPassword("");
          setNewPassword("");
          setOk("Saved.");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save");
        } finally {
          setSaving(false);
        }
      }}
    >
      <p className="text-sm text-garawol-muted">Signed in as {props.roleLabel}</p>
      <div>
        <label className="label">Full name</label>
        <input
          className="field"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Phone</label>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Current password</label>
          <input
            className="field"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={newPassword ? "Required to change" : "Only if changing"}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            className="field"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep"
            autoComplete="new-password"
          />
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
      {ok && <p className="text-sm font-semibold text-garawol-green">{ok}</p>}
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save my details"}
      </button>
    </form>
  );
}
