import type { FormatType } from '../../types';
import { FORMATS } from '../../types';

interface Props {
  format: FormatType;
  mode: string;
  lineCount: number;
  charCount: number;
}

export function Footer({ format, mode, lineCount, charCount }: Props) {
  const fmt = FORMATS.find(f => f.value === format);
  return (
    <div className="footer">
      <div className="footer-left">
        <span className="footer-section">
          <span className="footer-section-icon">&#9670;</span>
          <span className="footer-label">Format</span>
          <span className="footer-value">{fmt?.label || format}</span>
        </span>
        <span className="footer-section">
          <span className="footer-section-icon">&#9881;</span>
          <span className="footer-label">Mode</span>
          <span className="footer-value">{mode}</span>
        </span>
      </div>
      <div className="footer-right">
        <span className="footer-section">
          <span className="footer-label">Lines</span>
          <span className="footer-value">{lineCount}</span>
        </span>
        <span className="footer-section">
          <span className="footer-label">Chars</span>
          <span className="footer-value">{charCount}</span>
        </span>
      </div>
    </div>
  );
}
