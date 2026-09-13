"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Shows an Install app button when Chromium fires beforeinstallprompt.
 * iOS Safari never fires this — show a short tip instead.
 */
export function InstallPwaButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosTip, setIosTip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) setIosTip(true);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferred(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <button
        type="button"
        className={
          className ||
          "btn-secondary w-full border border-garawol-line bg-white text-garawol-ink shadow-sm"
        }
        onClick={async () => {
          await deferred.prompt();
          const choice = await deferred.userChoice;
          if (choice.outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        Install MF &amp; F desk app
      </button>
    );
  }

  if (iosTip) {
    return (
      <p className="rounded-2xl bg-garawol-mist px-4 py-3 text-sm text-garawol-muted">
        On iPhone: tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install with the company logo.
      </p>
    );
  }

  return null;
}
