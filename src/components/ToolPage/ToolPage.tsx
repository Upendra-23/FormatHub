import { useRef, useEffect, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { FormatType, ValidationError, SQLDialect, EncodeDecodeMode, ActionMode, AppSection, ConverterId } from '../../types';
import { FORMATS, TOOL_DESCRIPTIONS, CONVERTER_DESCRIPTIONS, CONVERTERS } from '../../types';

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
  const desc = isConverter && converterDef
    ? CONVERTER_DESCRIPTIONS[converterDef.id]
    : TOOL_DESCRIPTIONS[format as keyof typeof TOOL_DESCRIPTIONS] || { title: '', description: '' };
  const inputLang = isConverter && converterDef ? converterDef.fromFormat : (fmt?.language || 'plaintext');
  const outputLang = isConverter && converterDef ? converterDef.toFormat : (fmt?.language || 'plaintext');
  const inputLabel = isConverter && converterDef ? converterDef.fromLabel : 'Input';
  const outputLabel = isConverter && converterDef ? converterDef.toLabel : 'Output';

  const isBase64 = !isConverter && format === 'base64';
  const isUrl = !isConverter && format === 'url';
  const isSql = !isConverter && format === 'sql';
  const isMarkdown = !isConverter && format === 'markdown';

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

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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
      base64: 'txt', url: 'txt', yaml: 'yml', csv: 'csv',
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

  return (
    <div className="tool-page">
      <div className="tool-header">
        <h1 className="tool-title">{desc.title}</h1>
        <p className="tool-description">{desc.description}</p>
      </div>

      <div className="tool-options-bar">
        {isSql && (
          <div className="option-group">
            <label className="option-label">Dialect:</label>
            <select
              className="option-select"
              value={sqlDialect}
              onChange={e => onSqlDialectChange(e.target.value as SQLDialect)}
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="oracle">Oracle</option>
              <option value="sqlserver">SQL Server</option>
            </select>
          </div>
        )}

        {!isConverter && fmt.supportsFormat && fmt.supportsMinify && (
          <div className="option-group">
            <label className="option-label">Mode:</label>
            <div className="option-toggle">
              <button
                className={`toggle-btn ${mode === 'format' ? 'active' : ''}`}
                onClick={() => onModeChange('format')}
              >
                Format
              </button>
              <button
                className={`toggle-btn ${mode === 'minify' ? 'active' : ''}`}
                onClick={() => onModeChange('minify')}
              >
                Minify
              </button>
            </div>
          </div>
        )}

        {(isBase64 || isUrl) && (
          <div className="option-group">
            <label className="option-label">Action:</label>
            <div className="option-toggle">
              <button
                className={`toggle-btn ${encodeDecodeMode === 'encode' ? 'active' : ''}`}
                onClick={() => onEncodeDecodeModeChange('encode')}
              >
                Encode
              </button>
              <button
                className={`toggle-btn ${encodeDecodeMode === 'decode' ? 'active' : ''}`}
                onClick={() => onEncodeDecodeModeChange('decode')}
              >
                Decode
              </button>
            </div>
          </div>
        )}

        <div className="option-group option-group-right">
          <button className="tool-action-btn" onClick={onToggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {'\u26F6'}
          </button>
          <button className="tool-action-btn" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div ref={editorsRef} className="tool-editors">
        <div className="tool-editor-pane" style={{ width: `${leftRatio * 100}%`, flex: 'none' }}>
          <div className="pane-header">
            <span className="pane-title">{inputLabel}</span>
            <div className="pane-actions">
              <button className="tool-action-btn" onClick={handleFileUpload} title="Upload file">
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xml,.html,.css,.js,.sql,.yaml,.yml,.csv,.ini,.txt,.md"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
            </div>
          </div>
          <div className="pane-editor">
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
                fontFamily: "var(--font-mono)",
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                matchBrackets: 'always',
                codeLens: false,
                suggestOnTriggerCharacters: true,
                quickSuggestions: false,
                formatOnPaste: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 8 },
                glyphMargin: true,
              }}
            />
          </div>
        </div>
        <div className="resizer" onPointerDown={onResizerPointerDown} />

        <div className="tool-editor-pane" style={{ flex: '1', width: 0 }}>
          <div className="pane-header">
            <span className="pane-title">
              {isConverter ? outputLabel : 'Output'}
            </span>
            <div className="pane-actions">
              <button className="tool-action-btn" onClick={handleCopy}>Copy</button>
              <button className="tool-action-btn" onClick={handleDownload}>Download</button>
            </div>
          </div>
          <div className="pane-editor">
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
                  fontFamily: "var(--font-mono)",
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  padding: { top: 8 },
                  glyphMargin: true,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {formatError && (
        <div className="tool-format-error">
          <span className="error-icon">&#10007;</span>
          <span>{formatError}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="tool-validation-errors">
          <div className="validation-errors-header">
            <span className="validation-errors-title">Problems ({errors.length})</span>
          </div>
          <div className="validation-errors-body">
            {errors.map((err, i) => (
              <div className="error-item" key={i}>
                <span className="error-icon">&#10007;</span>
                <span className="error-loc">Line {err.line}, Col {err.column}</span>
                <span className="error-msg">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
