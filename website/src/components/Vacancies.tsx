import { useEffect, useMemo, useState } from "react";
import { Reveal } from "./Reveal";
import {
  fetchVacancies,
  formatGmd,
  mediaUrl,
  type PublicVacancy,
} from "../lib/vacancies";

type Props = {
  onEnquire: (vacancy: PublicVacancy) => void;
};

export function Vacancies({ onEnquire }: Props) {
  const [items, setItems] = useState<PublicVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchVacancies();
        if (!cancelled) setItems(data.vacancies);
      } catch {
        if (!cancelled) {
          setError("Vacancies are unavailable right now. Please try again shortly.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const v of items) {
      if (v.area?.trim()) set.add(v.area.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((v) => {
      if (area !== "all" && (v.area || "") !== area) return false;
      if (!term) return true;
      return [v.code, v.type, v.propertyName, v.area, v.address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [items, query, area]);

  return (
    <section className="section vacancies" id="vacancies">
      <div className="section-inner">
        <p className="eyebrow">Available now</p>
        <h2>Vacant places</h2>
        <p className="section-lead">
          Browse empty units currently managed by MF &amp; F. Asking rents are shown when on file —
          enquire with the office to view or reserve.
        </p>

        <div className="vacancy-toolbar">
          <label className="vacancy-search">
            <span className="sr-only">Search vacancies</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by area, building, or unit…"
            />
          </label>
          {areas.length > 0 ? (
            <label className="vacancy-filter">
              <span className="sr-only">Filter by area</span>
              <select value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="all">All areas</option>
                {areas.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {loading ? (
          <p className="vacancy-status">Loading vacant places…</p>
        ) : error ? (
          <p className="vacancy-status vacancy-status--error">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="vacancy-status">
            {items.length === 0
              ? "No vacant places listed at the moment. Check back soon or contact the office."
              : "No vacancies match that search."}
          </p>
        ) : (
          <ul className="vacancy-grid">
            {filtered.map((v) => {
              const photo = mediaUrl(v.photoUrl);
              return (
                <li key={v.id}>
                  <Reveal>
                    <article className="vacancy-card">
                      <div
                        className={`vacancy-photo${photo ? "" : " vacancy-photo--empty"}`}
                        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
                        role="img"
                        aria-label={photo ? `${v.code} at ${v.propertyName}` : "No photo yet"}
                      />
                      <div className="vacancy-body">
                        <p className="vacancy-kicker">
                          {v.area || "Greater Banjul"}
                          {v.type ? ` · ${v.type}` : ""}
                        </p>
                        <h3>
                          {v.code}
                          <span> · {v.propertyName}</span>
                        </h3>
                        {v.address ? <p className="vacancy-address">{v.address}</p> : null}
                        <p className="vacancy-rent">
                          {v.askingRentGmd != null ? (
                            <>
                              <strong>{formatGmd(v.askingRentGmd)}</strong>
                              <span> asking</span>
                            </>
                          ) : (
                            <span>Ask the office for rent</span>
                          )}
                        </p>
                        <a
                          className="btn btn-navy vacancy-cta"
                          href="#contact"
                          onClick={() => onEnquire(v)}
                        >
                          Enquire
                        </a>
                      </div>
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
