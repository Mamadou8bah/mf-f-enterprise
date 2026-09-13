"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { formatGmd } from "@garawol/shared";

function Inner() {
  const sp = useSearchParams();
  const no = sp.get("no") || "LOCAL";
  const amount = Number(sp.get("amount") || 0);
  return (
    <div className="space-y-5 lg:space-y-7">
      <div>
        <p className="text-sm font-medium text-garawol-muted">Offline</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-garawol-ink lg:text-3xl">
          Saved offline
        </h1>
      </div>
      <div className="rounded-[1.5rem] bg-white p-6 shadow-card">
        <p className="text-sm text-garawol-muted">
          Provisional receipt <strong className="text-garawol-ink">{no}</strong> for{" "}
          <strong className="text-garawol-ink">{formatGmd(amount)}</strong>. It will get an
          official MFF number when you reconnect and sync.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-[#0B1220] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Today
        </Link>
      </div>
    </div>
  );
}

export default function LocalReceiptPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
