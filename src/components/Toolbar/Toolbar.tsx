import type { FormatType, SQLDialect, ActionMode, EncodeDecodeMode } from '../../types';
import type { ThemeName } from '../../hooks/useTheme';
import { FORMATS } from '../../types';
import { FormatSelector } from './FormatSelector';
import logoSrc from '../../assets/app-logo.png';

interface Props {
  format: FormatType;
  mode: ActionMode;
  sqlDialect: SQLDialect;
  encodeDecodeMode: EncodeDecodeMode;
  onFormatChange: (f: FormatType) => void;
  onModeChange: (m: ActionMode) => void;
  onSqlDialectChange: (d: SQLDialect) => void;
  onEncodeDecodeModeChange: (m: EncodeDecodeMode) => void;
  onProcess: () => void;
  onClear: () => void;
  theme: ThemeName;
  onThemeChange: (t: ThemeName) => void;
}

export function Toolbar({
  format,
  mode,
  sqlDialect,
  encodeDecodeMode,
  onFormatChange,
  onModeChange,
  onSqlDialectChange,
  onEncodeDecodeModeChange,
  onProcess,
  onClear,
  theme,
  onThemeChange,
}: Props) {
  const fmt = FORMATS.find(f => f.value === format)!;
  const isBase64 = format === 'base64';
  const isUrl = format === 'url';
  const isSql = format === 'sql';

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <img src={logoSrc} alt="FormatHub" className="toolbar-logo" />
        <span className="toolbar-brand">FormatHub</span>
        <FormatSelector format={format} onChange={onFormatChange} />
        {isSql && (
          <select
            className="dialect-select"
            value={sqlDialect}
            onChange={e => onSqlDialectChange(e.target.value as SQLDialect)}
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="oracle">Oracle</option>
            <option value="sqlserver">SQL Server</option>
          </select>
        )}
        {fmt.supportsFormat && fmt.supportsMinify && (
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'format' ? 'active' : ''}`}
              onClick={() => onModeChange('format')}
            >
              Format
            </button>
            <button
              className={`mode-btn ${mode === 'minify' ? 'active' : ''}`}
              onClick={() => onModeChange('minify')}
            >
              Minify
            </button>
          </div>
        )}
        {isBase64 && (
          <div className="mode-toggle">
            <button
              className={`mode-btn ${encodeDecodeMode === 'encode' ? 'active' : ''}`}
              onClick={() => onEncodeDecodeModeChange('encode')}
            >
              Encode
            </button>
            <button
              className={`mode-btn ${encodeDecodeMode === 'decode' ? 'active' : ''}`}
              onClick={() => onEncodeDecodeModeChange('decode')}
            >
              Decode
            </button>
          </div>
        )}
        {isUrl && (
          <div className="mode-toggle">
            <button
              className={`mode-btn ${encodeDecodeMode === 'encode' ? 'active' : ''}`}
              onClick={() => onEncodeDecodeModeChange('encode')}
            >
              Encode
            </button>
            <button
              className={`mode-btn ${encodeDecodeMode === 'decode' ? 'active' : ''}`}
              onClick={() => onEncodeDecodeModeChange('decode')}
            >
              Decode
            </button>
          </div>
        )}
        {(isBase64 || isUrl) && (
          <button className="tool-btn primary" onClick={onProcess}>
            Convert
          </button>
        )}
      </div>
      <div className="toolbar-right">
        <button className="tool-btn" onClick={onClear}>
          Clear
        </button>
        <select
          className="theme-select"
          value={theme}
          onChange={e => onThemeChange(e.target.value as ThemeName)}
          title="Theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="monokai">Monokai</option>
          <option value="darcula">Darcula</option>
        </select>
      </div>
    </div>
  );
}
