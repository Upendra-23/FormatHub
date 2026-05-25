import logoSrc from '../../assets/app-logo.png';

export function Footer() {
  return (
    <div className="footer">
      <span className="footer-left">
        <img src={logoSrc} alt="FormatHub" className="footer-logo" />
        <span className="footer-text">FormatHub &mdash; a universal code formatter</span>
      </span>
      <span className="footer-version">v0.1.0</span>
    </div>
  );
}
