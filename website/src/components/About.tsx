import { Reveal } from "./Reveal";

export function About() {
  return (
    <section className="section about" id="about">
      <div className="section-inner about-grid">
        <div>
          <p className="eyebrow">About</p>
          <h2>Built for how rent really works here</h2>
          <p className="section-lead">
            MF &amp; F Enterprise is a property and rent desk for owners who want reliable collection
            without losing the human touch. Secretaries record payments carefully; landlords get a
            clean trail; tenants leave with a printed receipt they can keep.
          </p>
        </div>
        <Reveal>
          <aside className="about-panel" aria-label="At a glance">
            <p className="about-stat">
              <strong>Official receipts</strong> every payment
            </p>
            <p className="about-stat">
              <strong>Property rounds</strong> for collectors
            </p>
            <p className="about-stat">
              <strong>Owner reports</strong> by building
            </p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
