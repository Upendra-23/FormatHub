import type { FormatType } from '../../types';
import { FORMATS } from '../../types';

interface Props {
  format: FormatType;
  onChange: (f: FormatType) => void;
}

export function FormatSelector({ format, onChange }: Props) {
  return (
    <select
      className="format-select"
      value={format}
      onChange={e => onChange(e.target.value as FormatType)}
    >
      {FORMATS.map(f => (
        <option key={f.value} value={f.value}>
          {f.label}
        </option>
      ))}
    </select>
  );
}
