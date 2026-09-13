"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { QuickAddFab } from "@/components/QuickAddFab";
import { BrandLogo } from "@/components/BrandLogo";
import { LogoutButton } from "@/components/LogoutButton";
import {
  HomeIcon,
  RoundsIcon,
  DueIcon,
  SearchIcon,
  DocsIcon,
  ReceiptsIcon,
  SettingsIcon,
  PlusIcon,
  PeopleIcon,
  BuildingIcon,
  MenuIcon,
} from "@/components/icons";
import clsx from "clsx";
import { roleLabel } from "@/lib/roles";

const mobileLinks: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Home", icon: <HomeIcon className="h-6 w-6" /> },
  { href: "/tenants", label: "Tenants", icon: <PeopleIcon className="h-6 w-6" /> },
  { href: "/properties", label: "Buildings", icon: <BuildingIcon className="h-6 w-6" /> },
  { href: "/documents/arrears", label: "Due", icon: <DueIcon className="h-6 w-6" /> },
];

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/search", label: "Find tenant / pay" },
  { href: "/tenants", label: "Tenants" },
  { href: "/documents/vacancy", label: "Vacant units" },
  { href: "/documents/arrears", label: "Due & overdue" },
  { href: "/receipts", label: "Receipts" },
  { href: "/properties", label: "Properties" },
  { href: "/documents", label: "Documents & reports" },
  { href: "/settings", label: "Settings" },
];

const desktopRail = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search / pay", icon: SearchIcon },
  { href: "/tenants", label: "Tenants", icon: PeopleIcon },
  { href: "/documents/arrears", label: "Due & overdue", icon: DueIcon },
  { href: "/properties", label: "Properties", icon: RoundsIcon },
  { href: "/receipts", label: "Receipts", icon: ReceiptsIcon },
  { href: "/documents", label: "Documents", icon: DocsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function pathMatches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function isActive(pathname: string, href: string, siblings: string[]) {
  if (!pathMatches(pathname, href)) return false;
  const steals = siblings.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      other.startsWith(href + "/") &&
      pathMatches(pathname, other)
  );
  return !steals;
}

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const hrefs = navLinks.map((l) => l.href);
  return (
    <>
      {navLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className={clsx(
            "block min-h-12 rounded-2xl px-3.5 py-3 text-base font-medium transition active:scale-[0.99]",
            isActive(pathname, l.href, hrefs)
              ? "bg-garawol-green text-white"
              : "text-garawol-ink active:bg-garawol-mist"
          )}
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const [drawer, setDrawer] = useState(false);
  const isLogin = pathname === "/login";
  const isReceipt = pathname.startsWith("/receipts/") && pathname !== "/receipts/local";
  const railHrefs = desktopRail.map((l) => l.href);
  const mobileHrefs = mobileLinks.map((m) => m.href);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  if (isLogin) return <>{children}</>;

  return (
    <div className="app-root lg:flex lg:min-h-screen lg:bg-[#EEF1F6]">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 z-30 hidden h-screen w-60 shrink-0 flex-col bg-[#0B1220] px-3 py-5 xl:w-64 lg:flex">
        <div className="mb-6 px-2">
          <BrandLogo size={40} showWordmark light />
        </div>
        <Link
          href="/search"
          className="mb-4 flex items-center gap-2.5 rounded-2xl bg-garawol-clay px-3 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm transition hover:bg-[#B8921F]"
        >
          <PlusIcon className="h-5 w-5 shrink-0" />
          Record payment
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {desktopRail.map((l) => {
            const Icon = l.icon;
            const active = isActive(pathname, l.href, railHrefs);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[#1E2A40] text-white"
                    : "text-[#9AA8BD] hover:bg-[#162033] hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-3 border-t border-[#243044] px-1 pt-4">
          <Link href="/settings" className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-[#162033]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-garawol-green text-sm font-bold text-white">
              {(data?.user?.name || "M").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{data?.user?.name}</p>
              <p className="truncate text-sm text-[#9AA8BD]">{roleLabel(data?.user?.role)}</p>
            </div>
          </Link>
          <LogoutButton variant="dark" />
        </div>
      </aside>

      {/* Main column — fixed app viewport on mobile */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-screen">
        <header className="app-topbar no-print sticky top-0 z-30 lg:hidden">
          <div className="flex items-center gap-2 px-3 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <BrandLogo size={36} />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[15px] font-bold tracking-tight text-garawol-green">MF &amp; F</p>
                <p className="truncate text-[11px] font-medium text-garawol-soft">Office desk</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Menu"
                onClick={() => setDrawer(true)}
                className="app-chrome-btn flex h-11 w-11 items-center justify-center rounded-full text-garawol-ink"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <div
          className={clsx(
            "print-shell app-scroll mx-auto w-full max-w-[1400px] flex-1",
            isReceipt
              ? "px-3 pb-6 pt-3 sm:px-4"
              : "px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-4 lg:px-8 lg:pb-10 lg:pt-8"
          )}
        >
          <main>{children}</main>
        </div>
      </div>

      {!isReceipt && (
        <div className="lg:hidden">
          <QuickAddFab />
        </div>
      )}

      {/* Mobile tab bar */}
      {!isReceipt && (
        <nav className="app-tabbar no-print fixed inset-x-0 bottom-0 z-30 lg:hidden" aria-label="Main">
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
            {mobileLinks.map((l) => {
              const active = isActive(pathname, l.href, mobileHrefs);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1 text-[11px] font-semibold leading-none tracking-wide transition active:scale-95",
                    active ? "text-garawol-green" : "text-garawol-soft"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-8 w-12 items-center justify-center rounded-2xl transition",
                      active && "bg-garawol-greenSoft text-garawol-green"
                    )}
                  >
                    {l.icon}
                  </span>
                  <span className="max-w-full truncate">{l.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile drawer */}
      {drawer && (
        <div className="no-print fixed inset-0 z-[60] flex justify-end lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#0B1220]"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <aside className="app-drawer relative flex h-full w-[min(22rem,88%)] max-w-xs flex-col bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-lift">
            <div className="mb-5 flex items-center gap-3 border-b border-garawol-line px-1 pb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-garawol-green text-lg font-bold text-white">
                {(data?.user?.name || "M").slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-garawol-ink">{data?.user?.name}</p>
                <p className="truncate text-sm text-garawol-muted">
                  {roleLabel(data?.user?.role)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setDrawer(false)}
                className="app-chrome-btn flex h-10 w-10 items-center justify-center rounded-full text-xl text-garawol-ink"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              <NavItems pathname={pathname} onNavigate={() => setDrawer(false)} />
            </nav>
            <div className="mt-3 space-y-2 border-t border-garawol-line pt-3">
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
