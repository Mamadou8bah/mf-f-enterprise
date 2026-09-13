import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <BrandLogo size={56} showWordmark />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight text-garawol-ink">
        You are offline
      </h1>
      <p className="mt-2 text-sm text-garawol-muted">
        Payments already saved on this phone stay in the outbox and sync when you reconnect.
        Open pages you used recently may still work from cache.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Try again
      </Link>
    </div>
  );
}
