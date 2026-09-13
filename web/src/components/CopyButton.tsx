"use client";

import { useState } from "react";
import clsx from "clsx";

export function CopyButton({
  text,
  label = "Copy",
  variant = "pill",
}: {
  text: string;
  label?: string;
  variant?: "pill" | "link";
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={clsx(
          "text-sm font-semibold transition min-h-11",
        variant === "pill" &&
          "inline-flex items-center rounded-full bg-white px-4 py-2 text-garawol-ink shadow-sm hover:bg-garawol-mist",
        variant === "link" && "text-garawol-muted hover:text-garawol-green"
      )}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
