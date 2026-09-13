export function Hero() {
  return (
    <section className="hero" id="top" aria-label="Introduction">
      <div
        className="hero-media"
        role="img"
        aria-label="City buildings under a clear sky"
      />
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="hero-brand">MF &amp; F Enterprise</p>
          <h1>Property &amp; rent management you can trust</h1>
          <p className="hero-lead">
            We look after rental buildings across Greater Banjul — collecting rent, issuing clear
            receipts, and listing vacant places for the public to enquire.
          </p>
          <div className="hero-actions">
            <a className="btn btn-gold" href="#vacancies">
              Browse vacant places
            </a>
            <a className="btn btn-ghost" href="#contact">
              Talk to the office
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
