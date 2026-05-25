import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { ValidationError, FormatType } from '../../types';
import { FORMATS } from '../../types';

interface Props {
  value: string;
  format: FormatType;
  monacoTheme: string;
  inputText?: string;
  inputErrors?: ValidationError[];
}

export function OutputPanel({ value, format, monacoTheme, inputText, inputErrors }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorRef = useRef<string[]>([]);

  const lang = FORMATS.find(f => f.value === format)?.language || 'plaintext';

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    decorRef.current = editor.deltaDecorations(decorRef.current, []);

    const showGreen = inputErrors && inputErrors.length > 0 && value === inputText;
    if (!showGreen) return;

    const decorations = inputErrors.map(err => {
      const model = editor.getModel();
      if (!model) return null;
      const lineCount = model.getLineCount();
      const line = Math.min(err.line, lineCount);
      const lineContent = model.getLineContent(line);
      const col = Math.min(err.column, lineContent.length + 1);
      return {
        range: new monaco.Range(
          line, col,
          line, err.length ? Math.min(col + err.length - 1, lineContent.length + 1) : Math.min(col + 1, lineContent.length + 1)
        ),
        options: {
          isWholeLine: false,
          className: 'output-error-highlight',
          inlineClassName: 'output-error-inline',
          glyphMarginClassName: 'output-error-glyph',
          hoverMessage: { value: `**Issue**: ${err.message}` },
        },
      };
    }).filter((v): v is NonNullable<typeof v> => v !== null);

    decorRef.current = editor.deltaDecorations(decorRef.current, decorations);
  }, [inputErrors, inputText, value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      json: 'json', xml: 'xml', yaml: 'yml', sql: 'sql',
      html: 'html', css: 'css', javascript: 'js', markdown: 'md',
      csv: 'csv', properties: 'ini', base64: 'txt', url: 'txt',
    };
    const ext = extMap[format] || 'txt';
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">Output</span>
        <div className="pane-actions">
          <button className="tool-btn" onClick={handleCopy} title="Copy to clipboard">
            Copy
          </button>
          <button className="tool-btn" onClick={handleDownload} title="Download">
            Download
          </button>
        </div>
      </div>
      <Editor
        height="100%"
        language={lang}
        value={value}
        theme={monacoTheme}
        onMount={handleMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          folding: true,
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          padding: { top: 8 },
          domReadOnly: true,
          glyphMargin: true,
        }}
      />
    </div>
  );
}
