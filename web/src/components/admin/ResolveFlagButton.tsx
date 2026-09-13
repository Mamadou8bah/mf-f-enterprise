"use client";

import { useRouter } from "next/navigation";

export function ResolveFlagButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-secondary mt-2 py-2 text-xs"
      onClick={async () => {
        await fetch("/api/admin/flags", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, resolved: true }),
        });
        router.refresh();
      }}
    >
      Mark resolved
    </button>
  );
}
