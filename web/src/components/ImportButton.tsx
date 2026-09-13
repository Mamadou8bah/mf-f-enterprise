"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const router = useRouter();

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn-primary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setResult("");
          try {
            const res = await fetch("/api/admin/import", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Import failed");
            setResult(JSON.stringify(data, null, 2));
            router.refresh();
          } catch (e) {
            setResult(e instanceof Error ? e.message : "Failed");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Importing…" : "Import Word docs"}
      </button>
      {result && <pre className="card overflow-auto p-3 text-xs">{result}</pre>}
    </div>
  );
}
