import { useRef, useEffect, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { FormatType, ValidationError, SQLDialect, EncodeDecodeMode, ActionMode, AppSection, ConverterId } from '../../types';
import { FORMATS, CONVERTERS } from '../../types';
import { CustomSelect } from '../CustomSelect';

interface Props {
  format: FormatType;
  section: AppSection;
  converterId?: ConverterId;
  input: string;
  output: string;
  mode: ActionMode;
  errors: ValidationError[];
  formatError: string | null;
  sqlDialect: SQLDialect;
  encodeDecodeMode: EncodeDecodeMode;
  monacoTheme: string;
  onInputChange: (val: string) => void;
  onModeChange: (m: ActionMode) => void;
  onSqlDialectChange: (d: SQLDialect) => void;
  onEncodeDecodeModeChange: (m: EncodeDecodeMode) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClear: () => void;
}

export function ToolPage({
  format,
  section,
  converterId,
  input,
  output,
  mode,
  errors,
  formatError,
  sqlDialect,
  encodeDecodeMode,
  monacoTheme,
  onInputChange,
  onModeChange,
  onSqlDialectChange,
  onEncodeDecodeModeChange,
  fullscreen,
  onToggleFullscreen,
  onClear,
}: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const outputEditorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const outputDecorRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const editorsRef = useRef<HTMLDivElement>(null);
  const [leftRatio, setLeftRatio] = useState(0.5);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const onResizerPointerDown = useCallback((e: React.PointerEvent) => {
    const container = editorsRef.current;
    if (!container) return;
    e.preventDefault();
    container.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      let ratio = (ev.clientX - rect.left) / rect.width;
      ratio = Math.max(0.15, Math.min(0.85, ratio));
      setLeftRatio(ratio);
    };

    const onUp = () => {
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerup', onUp);
    };

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', onUp);
  }, []);

  const isConverter = section === 'converter';
  const converterDef = isConverter ? CONVERTERS.find(c => c.id === converterId) : null;
  const fmt = FORMATS.find(f => f.value === format)!;
  const inputLang = isConverter && converterDef ? converterDef.fromFormat : (fmt?.language || 'plaintext');
  const outputLang = isConverter && converterDef ? converterDef.toFormat : (fmt?.language || 'plaintext');
  const inputLabel = isConverter && converterDef ? converterDef.fromLabel : 'Input';
  const outputLabel = isConverter && converterDef ? converterDef.toLabel : 'Output';

  const isBase64 = !isConverter && format === 'base64';
  const isUrl = !isConverter && format === 'url';
  const isSql = !isConverter && format === 'sql';
  const isMarkdown = !isConverter && format === 'markdown';


  const hasContent = input.trim().length > 0;

  const syncScrollToPreview = useCallback(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (!editor || !preview || syncing.current) return;

    const editorScroll = editor.getScrollTop();
    const editorHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
    if (editorHeight <= 0) return;

    const ratio = editorScroll / editorHeight;
    const previewHeight = preview.scrollHeight - preview.clientHeight;
    if (previewHeight <= 0) return;

    syncing.current = true;
    preview.scrollTop = ratio * previewHeight;
    syncing.current = false;
  }, []);

  const langRegistered = useRef(false);

  const ensurePropertiesLang = useCallback((monaco: Monaco) => {
    if (langRegistered.current) return;
    langRegistered.current = true;

    monaco.languages.register({ id: 'properties' });

    monaco.languages.setMonarchTokensProvider('properties', {
      tokenizer: {
        root: [
          [/^[ \t]*[#!].*$/, 'comment'],
          [/^([a-zA-Z0-9_.-]+)(\s*)([=: ])(\s*)(.*)$/, ['keyword', 'white', 'delimiter', 'white', 'string']],
          [/^([a-zA-Z0-9_.-]+)$/, 'keyword'],
        ],
      },
    });
  }, []);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    ensurePropertiesLang(monaco);

    editor.onDidChangeModelContent(() => {
      onInputChange(editor.getValue());
    });

    if (isMarkdown) {
      editor.onDidScrollChange(() => {
        syncScrollToPreview();
      });
    }
  };

  const handleOutputMount: OnMount = (editor) => {
    outputEditorRef.current = editor;
  };

  useEffect(() => {
    const editor = outputEditorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    outputDecorRef.current = editor.deltaDecorations(outputDecorRef.current, []);

    const model = editor.getModel();
    if (!model) return;

    const markers = errors.map(err => {
      const lineCount = model.getLineCount();
      const line = Math.min(err.line, lineCount);
      const lineContent = model.getLineContent(line);
      const col = Math.min(err.column, lineContent.length + 1);
      return {
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: line,
        startColumn: col,
        endLineNumber: line,
        endColumn: err.length ? Math.min(col + err.length, lineContent.length + 1) : Math.min(col + 10, lineContent.length + 1),
      };
    });

    monaco.editor.setModelMarkers(model, 'format-studio', markers);

    const decorations = errors.map(err => {
      const lineCount = model.getLineCount();
      const line = Math.min(err.line, lineCount);
      const lineContent = model.getLineContent(line);
      const col = Math.min(err.column, lineContent.length + 1);
      return {
        range: new monaco.Range(
          line, col,
          line, err.length ? Math.min(col + err.length, lineContent.length + 1) : Math.min(col + 1, lineContent.length + 1)
        ),
        options: {
          isWholeLine: false,
          className: 'error-squiggly',
          inlineClassName: 'error-inline',
          glyphMarginClassName: 'error-glyph',
          hoverMessage: { value: `**Error**: ${err.message}` },
        },
      };
    });

    outputDecorRef.current = editor.deltaDecorations(outputDecorRef.current, decorations);
  }, [errors, format, converterId]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!isMarkdown || !preview) return;

    const onScroll = () => {
      const editor = editorRef.current;
      if (!editor || syncing.current) return;

      const previewHeight = preview.scrollHeight - preview.clientHeight;
      if (previewHeight <= 0) return;

      const ratio = preview.scrollTop / previewHeight;
      const editorHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
      if (editorHeight <= 0) return;

      syncing.current = true;
      editor.setScrollTop(ratio * editorHeight);
      syncing.current = false;
    };

    preview.addEventListener('scroll', onScroll, { passive: true });
    return () => preview.removeEventListener('scroll', onScroll);
  }, [isMarkdown]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      json: 'json', xml: 'xml', sql: 'sql',
      html: 'html', css: 'css', javascript: 'js',
      base64: 'txt', url: 'txt', yaml: 'yml', csv: 'csv', properties: 'properties',
    };
    const targetFormat = isConverter && converterDef ? converterDef.toFormat : format;
    const ext = extMap[targetFormat] || 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      onInputChange(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const hasErrors = errors.length > 0;
  const hasValidOutput = hasContent && !hasErrors && output.length > 0 && !formatError;

  return (
    <div className="tool-page">
      <div className="toolbar">
        {isSql && (
          <>
                <div className="toolbar-group">
                  <span className="toolbar-label">Dialect</span>
                  <CustomSelect
                    value={sqlDialect}
                    options={[
                      { value: 'mysql', label: 'MySQL' },
                      { value: 'postgresql', label: 'PostgreSQL' },
                      { value: 'oracle', label: 'Oracle' },
                      { value: 'sqlserver', label: 'SQL Server' },
                    ]}
                    onChange={onSqlDialectChange}
                  />
                </div>
            <div className="toolbar-divider" />
          </>
        )}

        {!isConverter && fmt.supportsFormat && fmt.supportsMinify && (
          <>
            <div className="toolbar-group">
              <span className="toolbar-label">Mode</span>
              <div className="toolbar-toggle">
                <button
                  className={`toolbar-toggle-btn ${mode === 'format' ? 'active' : ''}`}
                  onClick={() => onModeChange('format')}
                >
                  Format
                </button>
                <button
                  className={`toolbar-toggle-btn ${mode === 'minify' ? 'active' : ''}`}
                  onClick={() => onModeChange('minify')}
                >
                  Minify
                </button>
              </div>
            </div>
            <div className="toolbar-divider" />
          </>
        )}

        {(isBase64 || isUrl) && (
          <>
            <div className="toolbar-group">
              <span className="toolbar-label">Action</span>
              <div className="toolbar-toggle">
                <button
                  className={`toolbar-toggle-btn ${encodeDecodeMode === 'encode' ? 'active' : ''}`}
                  onClick={() => onEncodeDecodeModeChange('encode')}
                >
                  Encode
                </button>
                <button
                  className={`toolbar-toggle-btn ${encodeDecodeMode === 'decode' ? 'active' : ''}`}
                  onClick={() => onEncodeDecodeModeChange('decode')}
                >
                  Decode
                </button>
              </div>
            </div>
            <div className="toolbar-divider" />
          </>
        )}

        <div className="toolbar-group">
          <span className="toolbar-label">Status</span>
          {!hasContent ? (
            <span className="validation-badge pending">
              <span className="validation-badge-dot" />
              Awaiting input
            </span>
          ) : hasErrors || formatError ? (
            <span className="validation-badge invalid">
              <span className="validation-badge-dot" />
              {errors.length} {errors.length === 1 ? 'error' : 'errors'}
            </span>
          ) : hasValidOutput ? (
            <span className="validation-badge valid">
              <span className="validation-badge-dot" />
              Valid
            </span>
          ) : null}
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleFileUpload} title="Upload file">
            &#128194; Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
                accept=".json,.xml,.html,.css,.js,.sql,.yaml,.yml,.csv,.properties,.ini,.txt,.md"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={onToggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {fullscreen ? '\u2199' : '\u26F6'}
          </button>
          <button className="toolbar-btn" onClick={onClear}>
            &#10005; Clear
          </button>
        </div>
      </div>

      <div ref={editorsRef} className="tool-editors">
        <div className="editor-pane editor-pane--input" style={{ width: `${leftRatio * 100}%`, flex: 'none' }}>
          <div className="editor-pane-header">
            <span className="editor-pane-title">
              <span className="editor-pane-indicator" />
              {inputLabel}
            </span>
          </div>
          <div className="editor-pane-body">
            <Editor
              height="100%"
              language={inputLang}
              value={input}
              theme={monacoTheme}
              onChange={v => onInputChange(v || '')}
              onMount={handleMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                renderLineHighlight: 'none',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                bracketPairColorization: { enabled: false },
                matchBrackets: 'never',
                selectionHighlight: true,
                occurrencesHighlight: 'off',
                codeLens: false,
                suggestOnTriggerCharacters: false,
                quickSuggestions: false,
                formatOnPaste: false,
                smoothScrolling: true,
                cursorBlinking: 'solid',
                cursorSmoothCaretAnimation: 'off',
                padding: { top: 12 },
                glyphMargin: false,
                lineNumbersMinChars: 3,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
              }}
            />
          </div>
        </div>

        <div className="editor-resizer" onPointerDown={onResizerPointerDown}>
          <div className="editor-resizer-track" />
        </div>

        <div className="editor-pane editor-pane--output" style={{ flex: '1', width: 0 }}>
          <div className="editor-pane-header">
            <span className="editor-pane-title">
              <span className="editor-pane-indicator" />
              {isConverter ? outputLabel : 'Output'}
            </span>
            <div className="editor-pane-actions">
              <button className="editor-pane-btn" onClick={handleCopy} title="Copy to clipboard">
                &#128203; Copy
              </button>
              <button className="editor-pane-btn" onClick={handleDownload} title="Download output">
                &#11015; Download
              </button>
            </div>
          </div>
          <div className="editor-pane-body">
            {isMarkdown ? (
              <div
                ref={previewRef}
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: errors.length === 0 ? output : '' }}
              />
            ) : (
              <Editor
                height="100%"
                language={outputLang}
                    value={output}
                    theme={monacoTheme}
                    onMount={handleOutputMount}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
                  lineNumbers: 'on',
                  renderLineHighlight: 'none',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  folding: true,
                  bracketPairColorization: { enabled: false },
                  matchBrackets: 'never',
                  selectionHighlight: false,
                  occurrencesHighlight: 'off',
                  smoothScrolling: true,
                  cursorBlinking: 'solid',
                  cursorSmoothCaretAnimation: 'off',
                  padding: { top: 12 },
                  glyphMargin: false,
                  lineNumbersMinChars: 3,
                  hideCursorInOverviewRuler: true,
                  overviewRulerLanes: 0,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {formatError && (
        <div className="tool-format-error">
          <span className="tool-format-error-icon">!</span>
          <span>{formatError}</span>
        </div>
      )}

      {hasErrors && (
        <div className="diagnostics-panel">
          <div className="diagnostics-header" onClick={() => setShowDiagnostics(d => !d)}>
            <div className="diagnostics-header-left">
              <span className="diagnostics-title">
                &#9888; Problems
              </span>
              <span className="diagnostics-count">{errors.length}</span>
            </div>
            <span className={`diagnostics-toggle ${showDiagnostics ? 'open' : ''}`}>
              &#9660;
            </span>
          </div>
          {showDiagnostics && (
            <div className="diagnostics-body">
              {errors.map((err, i) => (
                <div className="diagnostics-item" key={i}>
                  <span className="diagnostics-item-marker" />
                  <span className="diagnostics-item-loc">Ln {err.line}, Col {err.column}</span>
                  <span className="diagnostics-item-msg">{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
