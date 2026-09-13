import Link from "next/link";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/session";
import { getTodayStats } from "@/lib/queries";
import { formatGmdCompact } from "@garawol/shared";
import { ArrowUpRightIcon } from "@/components/icons";
import { PropertyIcon } from "@/components/PropertyIcon";
import { WeekCollectionsChart } from "@/components/WeekCollectionsChart";
import { PortfolioMixChart } from "@/components/PortfolioMixChart";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const session = await requireSession();
  const stats = await getTodayStats(session.user.id, session.user.propertyScope);
  const firstName = (session.user.name || "there").split(" ")[0];
  const rounds = stats.favorites.length
    ? stats.favorites
    : stats.properties.slice(0, 5);

  const occupiedPct =
    stats.unitCount > 0 ? Math.round((stats.occupied / stats.unitCount) * 100) : 0;
  const pipeline = Math.max(stats.monthCollected + stats.overdueAmount, 1);
  const collectedPct = Math.min(100, Math.round((stats.monthCollected / pipeline) * 100));

  return (
    <div className="space-y-5 lg:space-y-0">
      {/* ——— Mobile home ——— */}
      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-sm font-medium text-garawol-muted">Hello, {firstName}</p>
          <h1 className="mt-0.5 text-[1.85rem] font-semibold leading-tight tracking-tight text-garawol-ink">
            Today
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-garawol-soft">
            {stats.monthLabel}
          </p>
        </div>

        <section>
          <div className="app-list overflow-hidden bg-white">
            <div className="divide-y divide-garawol-line">
            <Link
              href="/receipts"
              className="flex items-center justify-between gap-3 px-4 py-4 active:bg-garawol-mist"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-garawol-muted">
                  Collected today
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-garawol-ink">
                  {formatGmdCompact(stats.collectedAmount)}
                </p>
              </div>
              <span className="text-sm font-semibold text-garawol-green">Receipts ›</span>
            </Link>
            <Link
              href="/documents/arrears"
              className="flex items-center justify-between gap-3 px-4 py-4 active:bg-garawol-mist"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-garawol-clay">
                  Overdue
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-garawol-ink">
                  {stats.overdue}
                  <span className="ml-2 text-sm font-semibold text-garawol-muted">
                    · {formatGmdCompact(stats.overdueAmount)}
                  </span>
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-garawol-clay">View ›</span>
            </Link>
            <Link
              href="/documents/arrears?filter=due_soon"
              className="flex items-center justify-between gap-3 px-4 py-4 active:bg-garawol-mist"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                  Due in 7 days
                </p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-garawol-ink">
                  {stats.dueSoon}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-amber-800">View ›</span>
            </Link>
            <Link
              href="/documents/collections"
              className="flex items-center justify-between gap-3 px-4 py-4 active:bg-garawol-mist"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-garawol-muted">
                  Collected this month
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-garawol-ink">
                  {formatGmdCompact(stats.monthCollected)}
                </p>
              </div>
              <span className="text-sm font-semibold text-garawol-muted">›</span>
            </Link>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="section-title">This week</h2>
            <Link
              href="/documents/collections?range=week"
              className="text-sm font-semibold text-garawol-green"
            >
              Details
            </Link>
          </div>
          <div className="rounded-[1.5rem] bg-white p-4 shadow-card">
            <WeekCollectionsChart data={stats.weekSeries} />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="section-title">Properties</h2>
            <Link href="/properties" className="text-sm font-semibold text-garawol-green">
              See all
            </Link>
          </div>
          <div className="app-list overflow-hidden bg-white">
            <div className="divide-y divide-garawol-line">
            {rounds.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.id}/round`}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-garawol-mist"
              >
                <PropertyIcon type={p.type} name={p.name} favorite={!!p.is_favorite} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-garawol-ink">{p.name}</p>
                  <p className="truncate text-xs text-garawol-muted">
                    {[p.area, p.type].filter(Boolean).join(" · ") || "Property"}
                  </p>
                </div>
                <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-garawol-soft" />
              </Link>
            ))}
            </div>
          </div>
        </section>
      </div>

      {/* ——— Desktop dashboard (reference-inspired) ——— */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-garawol-muted">Hello, {firstName}</p>
              <h1 className="mt-1 max-w-xl text-3xl font-semibold leading-[1.2] tracking-tight text-garawol-ink">
                Payments,{" "}
                <span className="inline-flex align-middle">
                  <span className="mx-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-garawol-claySoft text-sm text-garawol-goldInk">
                    ₵
                  </span>
                </span>{" "}
                receipts &amp; your{" "}
                <span className="inline-flex align-middle">
                  <span className="mx-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-garawol-greenSoft text-sm text-garawol-green">
                    ⌂
                  </span>
                </span>{" "}
                portfolio
              </h1>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/settings"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-garawol-muted shadow-card transition hover:text-garawol-ink"
                title="Settings"
              >
                ⚙
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-[#0B1220] px-5 py-3 text-base font-semibold text-white shadow-lift transition hover:bg-garawol-green"
              >
                <span className="text-base leading-none">+</span> Record payment
              </Link>
            </div>
          </div>

          {/* Pill tabs */}
          <div className="flex flex-wrap gap-2">
            <TabPill href="/" active>
              Overview
            </TabPill>
            <TabPill href="/documents/arrears">Overdue</TabPill>
            <TabPill href="/documents/arrears?filter=due_soon">Due in 7 days</TabPill>
            <TabPill href="/tenants">Tenants</TabPill>
            <TabPill href="/documents/vacancy">Vacancies</TabPill>
            <TabPill href="/receipts">Receipts</TabPill>
            <TabPill href="/properties">Properties</TabPill>
          </div>

          {/* KPI row */}
          <div className="grid gap-4 xl:grid-cols-3">
            <Link
              href="/receipts"
              className="rounded-[1.75rem] bg-[#F4F6FA] p-6 transition hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-garawol-muted">Collected today</p>
                  <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-garawol-ink">
                    {formatGmdCompact(stats.collectedAmount)}
                  </p>
                  <p className="mt-1 text-sm text-garawol-muted">
                    {stats.collectionsCount} payment{stats.collectionsCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-garawol-ink shadow-sm">
                  {stats.monthLabel}
                </span>
              </div>
              <SegmentBar
                filled={Math.min(12, Math.max(2, stats.collectionsCount || 1))}
                total={12}
                tone="ink"
              />
            </Link>

            <Link
              href="/documents/arrears"
              className="rounded-[1.75rem] bg-garawol-clay p-6 text-garawol-ink shadow-card transition hover:bg-[#B8921F]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-garawol-goldInk">Outstanding</p>
                  <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">
                    {formatGmdCompact(stats.overdueAmount)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-garawol-goldInk">
                    {stats.overdue} overdue tenants
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-garawol-ink">
                  {collectedPct}% in
                </span>
              </div>
              <SegmentBar
                filled={Math.min(12, Math.round((stats.overdue / Math.max(stats.tenantCount, 1)) * 12))}
                total={12}
                tone="ink"
              />
            </Link>

            <Link
              href="/search"
              className="relative overflow-hidden rounded-[1.75rem] bg-[#0B1220] p-6 text-white shadow-lift transition hover:bg-garawol-greenDark"
            >
              <p className="text-sm font-medium text-[#D5DEEA]">Office counter</p>
              <p className="mt-3 max-w-[12rem] text-2xl font-semibold leading-snug tracking-tight">
                Find a tenant and issue a receipt
              </p>
              <span className="mt-8 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-garawol-ink">
                Start now
              </span>
            </Link>
          </div>

          {/* Week chart */}
          <section className="rounded-[1.75rem] bg-white p-6 shadow-card xl:p-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-garawol-ink">
                  <Link href="/documents/collections?range=week" className="hover:text-garawol-green">
                    Collections this week
                  </Link>
                </h2>
                <p className="text-sm text-garawol-muted">
                  Daily totals ·{" "}
                  <Link
                    href="/documents/collections"
                    className="font-semibold text-garawol-ink hover:text-garawol-green"
                  >
                    month so far {formatGmdCompact(stats.monthCollected)}
                  </Link>
                </p>
              </div>
            </div>
            <WeekCollectionsChart data={stats.weekSeries} />
          </section>

          {/* Portfolio snapshot */}
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[1.75rem] bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-garawol-ink">Portfolio mix</h2>
              <p className="mt-1 text-sm text-garawol-muted">
                {stats.unitCount} units · {occupiedPct}% occupied
              </p>
              <div className="mt-4">
                <PortfolioMixChart
                  occupied={stats.occupied}
                  vacant={stats.vacancies}
                  unitCount={stats.unitCount}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricTile
                href="/documents/arrears"
                label="Overdue"
                value={String(stats.overdue)}
                meta={formatGmdCompact(stats.overdueAmount)}
              />
              <MetricTile
                href="/documents/arrears?filter=due_soon"
                label="Due in 7 days"
                value={String(stats.dueSoon)}
                meta="Coming up this week"
              />
              <MetricTile
                href="/documents/vacancy"
                label="Vacant units"
                value={String(stats.vacancies)}
                meta={`${occupiedPct}% occupied`}
              />
            </div>
          </section>
        </div>

        {/* Right utility column */}
        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniSquare href="/receipts" title="Receipts" subtitle="Today" />
            <MiniSquare href="/documents/collections" title="Collections" subtitle="By property" />
          </div>
          <div className="space-y-2">
            <UtilityLink
              href="/search"
              title="Record payment"
              desc="Search tenant and issue receipt"
            />
            <UtilityLink
              href="/documents/arrears"
              title="Overdue rent"
              desc={`${stats.overdue} late · ${formatGmdCompact(stats.overdueAmount)}`}
            />
            <UtilityLink
              href="/documents/arrears?filter=due_soon"
              title="Due in 7 days"
              desc={`${stats.dueSoon} coming up this week`}
            />
            <UtilityLink
              href="/tenants"
              title="Tenants directory"
              desc="Register, assign units, move out"
            />
            <UtilityLink
              href="/documents/vacancy"
              title="Vacant units"
              desc={`${stats.vacancies} rooms available`}
            />
            <UtilityLink
              href="/receipts"
              title="Receipts"
              desc="Reprint or WhatsApp share"
            />
            <UtilityLink
              href="/properties"
              title="Browse properties"
              desc={`${stats.propertyCount} buildings on file`}
            />
          </div>

          {rounds.length > 0 && (
            <div className="rounded-[1.75rem] bg-white p-4 shadow-card">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-garawol-muted">
                Quick open
              </p>
              <div className="space-y-2">
                {rounds.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    href={`/properties/${p.id}/round`}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-garawol-mist"
                  >
                    <PropertyIcon type={p.type} name={p.name} favorite={!!p.is_favorite} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-garawol-ink">
                      {p.name}
                    </span>
                    <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-garawol-soft" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function TabPill({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-[#0B1220] px-5 py-2.5 text-sm font-semibold text-white"
          : "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm transition hover:bg-[#E8ECF3]"
      }
    >
      {children}
    </Link>
  );
}

function SegmentBar({
  filled,
  total,
  tone,
}: {
  filled: number;
  total: number;
  tone: "ink" | "gold";
}) {
  return (
    <div className="mt-8 flex h-14 items-end gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${
            i < filled
              ? tone === "gold"
                ? "bg-garawol-goldInk"
                : "bg-[#0B1220]"
              : "bg-garawol-mist"
          }`}
          style={{ height: `${40 + ((i * 17) % 60)}%` }}
        />
      ))}
    </div>
  );
}

function MetricTile({
  href,
  label,
  value,
  meta,
}: {
  href: string;
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] bg-white p-5 shadow-card transition hover:shadow-lift"
    >
      <p className="text-sm font-medium text-garawol-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-garawol-ink">{value}</p>
      <p className="mt-1 text-sm font-medium text-garawol-soft">{meta}</p>
    </Link>
  );
}

function MiniSquare({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex aspect-square flex-col justify-between rounded-[1.5rem] bg-white p-4 shadow-card transition hover:shadow-lift"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-garawol-mist text-sm font-bold text-garawol-green">
        {title.slice(0, 1)}
      </span>
      <div>
        <p className="text-sm font-semibold text-garawol-ink">{title}</p>
        <p className="text-sm text-garawol-muted">{subtitle}</p>
      </div>
    </Link>
  );
}

function UtilityLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-[1.35rem] bg-[#E8ECF3] px-4 py-3.5 transition hover:bg-[#DEE4EF]"
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-garawol-green shadow-sm">
        {title.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-garawol-ink">{title}</span>
        <span className="block text-sm text-garawol-muted">{desc}</span>
      </span>
      <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-garawol-soft" />
    </Link>
  );
}
