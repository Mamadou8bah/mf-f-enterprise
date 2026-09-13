"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  preventClose = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md";
  preventClose?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, preventClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="no-print fixed inset-0 z-[80] flex items-end justify-center bg-[#0B1220] sm:items-center">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={() => !preventClose && onClose()}
      />
      <div
        className={clsx(
          "relative flex max-h-[min(92dvh,44rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-white sm:mx-4 sm:rounded-3xl",
          "pb-[env(safe-area-inset-bottom)]",
          size === "sm" ? "max-w-sm" : "max-w-lg"
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-garawol-line sm:hidden" />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-garawol-ink">{title}</p>
            {description ? <p className="mt-0.5 text-sm text-garawol-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => !preventClose && onClose()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-garawol-mist text-xl text-garawol-ink"
            aria-label="Close"
            disabled={preventClose}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
