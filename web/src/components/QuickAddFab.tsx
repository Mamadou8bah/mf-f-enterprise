"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Modal } from "@/components/Modal";
import {
  BuildingIcon,
  CalendarIcon,
  ChevronRightIcon,
  DueIcon,
  PaymentIcon,
  PersonIcon,
  PlusIcon,
  ReceiptsIcon,
  VacancyIcon,
} from "@/components/icons";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Quick add"
        onClick={() => setOpen(true)}
        className="no-print fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-garawol-green text-white shadow-card ring-4 ring-garawol-mist transition hover:bg-garawol-greenDark active:scale-95 bottom-[calc(4.85rem+env(safe-area-inset-bottom))] right-4 lg:bottom-8 lg:right-8 lg:ring-0"
      >
        <PlusIcon className="h-7 w-7" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Quick actions">
        <div className="-mx-1 divide-y divide-garawol-line">
          <SheetLink
            href="/search"
            title="Record payment"
            subtitle="Find tenant and issue receipt"
            tone="mint"
            icon={<PaymentIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/properties?new=1"
            title="Add property"
            subtitle="New building, plaza, or house"
            tone="sand"
            icon={<BuildingIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/tenants?register=1"
            title="Register tenant"
            subtitle="Add person, then assign a unit"
            tone="sky"
            icon={<PersonIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/documents/vacancy"
            title="Vacant units"
            subtitle="See empty rooms and assign"
            tone="sand"
            icon={<VacancyIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/documents/arrears"
            title="Overdue rent"
            subtitle="Already late — collect now"
            tone="peach"
            icon={<DueIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/documents/arrears?filter=due_soon"
            title="Due in 7 days"
            subtitle="Coming up this week"
            tone="sand"
            icon={<CalendarIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/receipts"
            title="Receipts"
            subtitle="Reprint or share"
            tone="sky"
            icon={<ReceiptsIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
          <SheetLink
            href="/properties"
            title="Properties"
            subtitle="Browse units by building"
            tone="sand"
            icon={<BuildingIcon className="h-6 w-6" />}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </Modal>
    </>
  );
}

function SheetLink({
  href,
  title,
  subtitle,
  tone,
  icon,
  onNavigate,
}: {
  href: string;
  title: string;
  subtitle: string;
  tone: "peach" | "sky" | "mint" | "sand";
  icon: ReactNode;
  onNavigate: () => void;
}) {
  const tones = {
    peach: "bg-garawol-claySoft text-garawol-goldInk",
    sky: "bg-garawol-sky text-garawol-skyInk",
    mint: "bg-garawol-greenSoft text-garawol-green",
    sand: "bg-garawol-sand text-garawol-ink",
  };
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-14 items-center gap-3 py-3.5 active:bg-garawol-mist"
    >
      <span
        className={clsx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          tones[tone]
        )}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-garawol-muted">{subtitle}</span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-garawol-line" />
    </Link>
  );
}
