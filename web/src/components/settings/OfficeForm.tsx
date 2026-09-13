"use client";

import { useState } from "react";
import type { OfficeSettings } from "@/lib/brand";

export function OfficeForm({ initial }: { initial: OfficeSettings }) {
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [companyShort, setCompanyShort] = useState(initial.companyShort);
  const [tagline, setTagline] = useState(initial.tagline);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [receiptPrefix, setReceiptPrefix] = useState(initial.receiptPrefix);
  const [receiptFooter, setReceiptFooter] = useState(initial.receiptFooter);
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
          const res = await fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyName,
              companyShort,
              tagline,
              phone,
              email,
              address,
              receiptPrefix,
              receiptFooter,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not save");
          setReceiptPrefix(data.receiptPrefix);
          setOk("Saved. New receipts and printouts will use this.");
          window.location.reload();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div>
        <label className="label">Company name</label>
        <input
          className="field"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Short name</label>
          <input
            className="field"
            value={companyShort}
            onChange={(e) => setCompanyShort(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="field" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Office address</label>
        <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Office phone</label>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Office email</label>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Receipt number prefix</label>
          <input
            className="field"
            value={receiptPrefix}
            onChange={(e) => setReceiptPrefix(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <p className="mt-1 text-xs text-garawol-muted">
            New receipts look like {receiptPrefix || "MFF"}-2026-00001. Old numbers stay as issued.
          </p>
        </div>
        <div>
          <label className="label">Receipt footer</label>
          <input
            className="field"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="Thank you"
          />
        </div>
      </div>
      {error && <p className="text-sm font-semibold text-red-800">{error}</p>}
      {ok && <p className="text-sm font-semibold text-garawol-green">{ok}</p>}
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save office details"}
      </button>
    </form>
  );
}
