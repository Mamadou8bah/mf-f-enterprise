export const PAGE_SIZE = 50;

export function parsePage(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export type PageResult<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  from: number;
  to: number;
  limit: number;
  offset: number;
};

export function pageWindow(total: number, page: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    total,
    pageSize,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    limit: pageSize,
    offset: start,
  };
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = PAGE_SIZE
): PageResult<T> {
  const window = pageWindow(items.length, page, pageSize);
  return {
    items: items.slice(window.offset, window.offset + window.limit),
    ...window,
  };
}

export function pageHref(
  pathname: string,
  current: Record<string, string | undefined>,
  page: number
) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (key === "page") continue;
    if (value) sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
