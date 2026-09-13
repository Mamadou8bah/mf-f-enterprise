import { useEffect, useState } from "react";

const links = [
  { href: "#vacancies", label: "Vacancies" },
  { href: "#services", label: "Services" },
  { href: "#areas", label: "Areas" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact", cta: true },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="top">
      <div className="top-inner">
        <a className="brand-mark" href="#top" aria-label="MF & F Enterprise home">
          <img src="/logo.png" alt="" width={40} height={40} />
          <span>MF &amp; F</span>
        </a>
        <nav className="nav" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={link.cta ? "nav-cta" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
      <div id="mobile-nav" className="mobile-nav" hidden={!open}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </div>
    </header>
  );
}
