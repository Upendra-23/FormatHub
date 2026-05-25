import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, Monaco } from '@monaco-editor/react';
import type { ValidationError, FormatType } from '../../types';
import { FORMATS } from '../../types';

interface Props {
  value: string;
  onChange: (val: string) => void;
  format: FormatType;
  errors: ValidationError[];
  monacoTheme: string;
}

const errorDecoration = {
  isWholeLine: false,
  className: 'error-squiggly',
  inlineClassName: 'error-inline',
  glyphMarginClassName: 'error-glyph',
  hoverMessage: { value: '' },
};

export function InputEditor({ value, onChange, format, errors, monacoTheme }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorRef = useRef<string[]>([]);

  const lang = FORMATS.find(f => f.value === format)?.language || 'plaintext';

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeModelContent(() => {
      onChange(editor.getValue());
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    decorRef.current = editor.deltaDecorations(decorRef.current, []);

    const markers = errors.map(err => {
      const model = editor.getModel();
      if (!model) return null;

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
    }).filter((v): v is NonNullable<typeof v> => v !== null);

    monaco.editor.setModelMarkers(editor.getModel()!, 'format-studio', markers);

    const decorations = errors.map(err => {
      const model = editor.getModel();
      if (!model) return null;
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
          ...errorDecoration,
          hoverMessage: { value: `**Error**: ${err.message}` },
        },
      };
    }).filter((v): v is NonNullable<typeof v> => v !== null);

    decorRef.current = editor.deltaDecorations(decorRef.current, decorations);
  }, [errors, format]);

  return (
    <div className="editor-pane">
      <div className="pane-header">
        <span className="pane-title">Input</span>
      </div>
      <Editor
        height="100%"
        language={lang}
        value={value}
        theme={monacoTheme}
        onChange={v => onChange(v || '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
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
  );
}
