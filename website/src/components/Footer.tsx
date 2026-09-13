export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="" width={36} height={36} />
          <div>
            <strong>MF &amp; F Enterprise</strong>
            <p>Property &amp; rent management</p>
          </div>
        </div>
        <p className="footer-copy">© {year} MF &amp; F Enterprise. All rights reserved.</p>
      </div>
    </footer>
  );
}
