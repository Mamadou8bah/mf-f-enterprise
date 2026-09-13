export type PublicVacancy = {
  id: string;
  code: string;
  type: string;
  askingRentGmd: number | null;
  photoUrl: string | null;
  propertyName: string;
  area: string | null;
  address: string | null;
};

export type VacanciesResponse = {
  company: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  count: number;
  vacancies: PublicVacancy[];
};

/** Desk app origin, e.g. https://desk.example.com or http://localhost:3000 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export async function fetchVacancies(): Promise<VacanciesResponse> {
  if (!API_BASE) {
    throw new Error(
      "Missing VITE_API_BASE. Set it to your desk app URL (see apps/website/.env.example)."
    );
  }
  const res = await fetch(`${API_BASE}/api/public/vacancies`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Could not load vacancies (${res.status})`);
  }
  return (await res.json()) as VacanciesResponse;
}

export function formatGmd(amount: number): string {
  return `D ${Math.round(amount).toLocaleString("en-GM")}`;
}
