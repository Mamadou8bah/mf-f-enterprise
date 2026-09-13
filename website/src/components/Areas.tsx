import { Reveal } from "./Reveal";

const areas = [
  "Kotu & Bijilo corridor",
  "Latrikunda & Sabiji",
  "Bundung & Tallinding",
  "Jeshwang & Pipeline",
  "Churchill’s Town & Dippa Kunda",
  "Tanjeh & Sinchu Alagie",
];

export function Areas() {
  return (
    <section className="section areas" id="areas">
      <div className="section-inner">
        <p className="eyebrow">Where we work</p>
        <h2>Buildings across Greater Banjul</h2>
        <p className="section-lead">
          Our portfolio spans neighbourhoods from the coast inland — plazas, compounds, and family
          buildings under careful day-to-day management.
        </p>
        <Reveal>
          <ul className="area-list">
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
