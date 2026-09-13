"use client";

import { useRouter } from "next/navigation";

export function ToggleFavoriteButton({
  propertyId,
  isFavorite,
}: {
  propertyId: string;
  isFavorite: boolean;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-secondary py-2 text-xs"
      onClick={async () => {
        await fetch("/api/admin/properties", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: propertyId, isFavorite: !isFavorite }),
        });
        router.refresh();
      }}
    >
      {isFavorite ? "Unpin" : "Pin"}
    </button>
  );
}
