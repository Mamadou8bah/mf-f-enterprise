import { Reveal } from "./Reveal";

const services = [
  {
    title: "Rent collection",
    body: "Walk-in payments at the desk, official MFF receipts, and a clear record for every period paid.",
  },
  {
    title: "Landlord reporting",
    body: "Property-level collection summaries so owners know what came in, what is due, and what is overdue.",
  },
  {
    title: "Tenant care",
    body: "Unit records, move-in and move-out, and a single place to confirm what has already been paid.",
  },
  {
    title: "Portfolio oversight",
    body: "Vacancy, arrears, and building rounds handled in one system — not scattered notebooks.",
  },
];

export function Services() {
  return (
    <section className="section services" id="services">
      <div className="section-inner">
        <p className="eyebrow">Services</p>
        <h2>One office for the full rent cycle</h2>
        <p className="section-lead">
          From occupancy to monthly collection, MF &amp; F keeps the paperwork and the money trail
          tidy.
        </p>
        <ul className="service-grid">
          {services.map((item) => (
            <li key={item.title}>
              <Reveal>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
