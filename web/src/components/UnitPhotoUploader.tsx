"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enqueueOutbox } from "@/lib/offline";
import { useSync } from "@/components/SyncProvider";

export function UnitPhotoUploader({ unitId }: { unitId: string }) {
  const router = useRouter();
  const sync = useSync();
  const [loading, setLoading] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    const dataUrl = await readAsDataUrl(file);
    try {
      if (!sync.online) {
        await enqueueOutbox({
          type: "photo",
          payload: { unitId, dataUrl },
          createdAt: new Date().toISOString(),
        });
        await sync.refresh();
        alert("Photo queued for upload when online");
      } else {
        const res = await fetch("/api/units/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unitId, dataUrl }),
        });
        if (!res.ok) throw new Error(await res.text());
        router.refresh();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="btn-secondary inline-flex cursor-pointer">
      {loading ? "Uploading…" : "Add photo"}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={loading}
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
    </label>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
