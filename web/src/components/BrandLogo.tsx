"use client";

import Image from "next/image";
import clsx from "clsx";
import { useOffice } from "@/components/OfficeProvider";
import { COMPANY_NAME, COMPANY_SHORT } from "@/lib/brand";

export function BrandLogo({
  className,
  size = 40,
  showWordmark = false,
  light = false,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  light?: boolean;
}) {
  const office = useOffice();
  const name = office.companyName || COMPANY_NAME;
  const short = office.companyShort || COMPANY_SHORT;

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <Image
        src="/mf_logo.png"
        alt={name}
        width={size}
        height={size}
        className="rounded-xl object-cover shadow-sm"
        priority
      />
      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <p
            className={clsx(
              "truncate text-base font-bold tracking-tight",
              light ? "text-white" : "text-garawol-green"
            )}
          >
            {short}
          </p>
          <p className="truncate text-[11px] font-medium text-garawol-clay">
            {office.tagline || "Enterprise"}
          </p>
        </div>
      )}
    </div>
  );
}
