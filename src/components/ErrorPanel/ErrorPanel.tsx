import type { ValidationError } from '../../types';

interface Props {
  errors: ValidationError[];
  formatError: string | null;
}

export function ErrorPanel({ errors, formatError }: Props) {
  if (errors.length === 0 && !formatError) return null;

  return (
    <div className="error-panel">
      <div className="error-panel-header">
        <span className="error-panel-title">Problems</span>
        <span className="error-count">{errors.length + (formatError ? 1 : 0)} issue(s)</span>
      </div>
      <div className="error-panel-body">
        {formatError && (
          <div className="error-item">
            <span className="error-icon">✕</span>
            <span className="error-msg">{formatError}</span>
          </div>
        )}
        {errors.map((err, i) => (
          <div className="error-item" key={i}>
            <span className="error-icon">✕</span>
            <span className="error-loc">
              Line {err.line}, Col {err.column}
            </span>
            <span className="error-msg">{err.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
