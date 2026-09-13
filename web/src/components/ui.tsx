import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";
import { ArrowUpRightIcon, ChevronLeftIcon } from "@/components/icons";
import { pageHref } from "@/lib/pagination";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  descriptionClassName,
  actionsClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  descriptionClassName?: string;
  actionsClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-garawol-soft lg:text-sm lg:normal-case lg:tracking-normal lg:font-medium lg:text-garawol-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 break-words text-[1.75rem] font-semibold leading-tight tracking-tight text-garawol-ink sm:text-3xl lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className={clsx("mt-1 text-sm text-garawol-muted lg:text-sm", descriptionClassName)}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          className={clsx(
            "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto",
            actionsClassName
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  const label = typeof children === "string" ? children.replace(/^←\s*/, "") : children;
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-0.5 py-2 text-sm font-semibold text-garawol-muted transition hover:text-garawol-green"
    >
      <ChevronLeftIcon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

export function PillLink({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex min-h-12 items-center justify-center rounded-full px-4 py-2.5 text-base font-semibold transition lg:min-h-10 lg:text-sm",
        variant === "primary" && "bg-[#0B1220] text-white hover:bg-garawol-green",
        variant === "secondary" && "bg-white text-garawol-ink shadow-sm hover:bg-garawol-mist",
        variant === "ghost" && "text-garawol-muted hover:text-garawol-green",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function PillTab({
  href,
  active,
  prefetch,
  children,
}: {
  href: string;
  active?: boolean;
  prefetch?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={clsx(
        "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-base font-semibold lg:min-h-9 lg:text-sm",
        active
          ? "bg-[#0B1220] text-white"
          : "bg-white text-garawol-ink shadow-sm"
      )}
    >
      {children}
    </Link>
  );
}

export function SoftCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-[1.5rem] bg-white shadow-card",
        padded && "p-5 lg:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SoftList({ children }: { children: ReactNode }) {
  return (
    <div className="app-list overflow-hidden rounded-[1.5rem] bg-white shadow-card lg:mx-0 lg:rounded-[1.5rem] lg:border-0 lg:shadow-card">
      <ul className="divide-y divide-garawol-line">{children}</ul>
    </div>
  );
}

export function SoftListItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={clsx("p-4 transition hover:bg-garawol-mist lg:px-6 lg:py-5", className)}>
      {children}
    </li>
  );
}

export function StatTile({
  label,
  value,
  meta,
  accent,
}: {
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.25rem] bg-white px-3 py-3 shadow-card sm:px-4 lg:px-5 lg:py-4">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-garawol-soft">{label}</p>
      <p
        className={clsx(
          "mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl lg:text-xl",
          accent ? "text-garawol-goldInk" : "text-garawol-ink"
        )}
      >
        {value}
      </p>
      {meta && <p className="mt-0.5 text-sm text-garawol-muted">{meta}</p>}
    </div>
  );
}

export function NavCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-start gap-3 rounded-[1.35rem] bg-white px-4 py-4 shadow-card transition hover:shadow-lift active:bg-garawol-mist"
    >
      {icon ?? (
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-garawol-greenSoft text-sm font-bold text-garawol-green">
          {title.slice(0, 1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-garawol-ink">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-garawol-muted">{description}</span>}
      </span>
      <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-garawol-soft" />
    </Link>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5 lg:space-y-7">{children}</div>;
}

export function Pagination({
  pathname,
  page,
  pageCount,
  total,
  from,
  to,
  params = {},
}: {
  pathname: string;
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
  params?: Record<string, string | undefined>;
}) {
  if (total === 0) return null;

  const href = (next: number) => pageHref(pathname, params, next);

  return (
    <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-garawol-muted">
        Showing {from}–{to} of {total}
      </p>
      {pageCount > 1 && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-garawol-ink shadow-sm"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-full px-4 text-sm font-semibold text-garawol-soft">
              Previous
            </span>
          )}
          <span className="min-w-[4.5rem] text-center text-sm font-semibold text-garawol-ink">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={href(page + 1)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-garawol-ink shadow-sm"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex min-h-12 items-center justify-center rounded-full px-4 text-sm font-semibold text-garawol-soft">
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}
