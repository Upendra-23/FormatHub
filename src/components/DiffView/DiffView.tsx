import { useRef, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';

interface Props {
  monacoTheme: string;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function DiffView({ monacoTheme, fullscreen, onToggleFullscreen }: Props) {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const originalFileRef = useRef<HTMLInputElement>(null);
  const modifiedFileRef = useRef<HTMLInputElement>(null);

  const handleOriginalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOriginal(reader.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleModifiedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setModified(reader.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSwap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
  };

  const hasBoth = original.length > 0 && modified.length > 0;

  return (
    <div className="diff-view">
      <div className="diff-toolbar">
        <div className="diff-source-group">
          <div className="diff-source">
            <span className="diff-source-label">Original</span>
            <div className="diff-source-input-row">
              <textarea
                className="diff-textarea"
                value={original}
                onChange={e => setOriginal(e.target.value)}
                placeholder="Paste original content here..."
                spellCheck={false}
              />
              <button className="toolbar-btn" onClick={() => originalFileRef.current?.click()}>
                &#128194; Upload
              </button>
              <input ref={originalFileRef} type="file" style={{ display: 'none' }} onChange={handleOriginalFile} />
            </div>
          </div>
          <div className="diff-source">
            <span className="diff-source-label">Modified</span>
            <div className="diff-source-input-row">
              <textarea
                className="diff-textarea"
                value={modified}
                onChange={e => setModified(e.target.value)}
                placeholder="Paste modified content here..."
                spellCheck={false}
              />
              <button className="toolbar-btn" onClick={() => modifiedFileRef.current?.click()}>
                &#128194; Upload
              </button>
              <input ref={modifiedFileRef} type="file" style={{ display: 'none' }} onChange={handleModifiedFile} />
            </div>
          </div>
        </div>
        <div className="diff-actions">
          <button className="toolbar-btn" onClick={handleSwap} title="Swap files">
            &#8646; Swap
          </button>
          <button className="toolbar-btn" onClick={handleClear} title="Clear both">
            &#10005; Clear
          </button>
          <div className="toolbar-spacer" />
          <button className="toolbar-btn" onClick={onToggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {fullscreen ? '\u2199' : '\u26F6'}
          </button>
        </div>
      </div>

      <div className="diff-editor-container">
        {hasBoth ? (
          <DiffEditor
            original={original}
            modified={modified}
            language="plaintext"
            theme={monacoTheme}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
              renderLineHighlight: 'none',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              minimap: { enabled: false },
              originalEditable: false,
              enableSplitViewResizing: true,
              renderSideBySide: true,
              smoothScrolling: true,
              padding: { top: 12 },
              hideCursorInOverviewRuler: true,
              overviewRulerLanes: 0,
              lineNumbersMinChars: 3,
            }}
          />
        ) : (
          <div className="diff-editor-placeholder">
            <div className="diff-placeholder-icon">&#8801;</div>
            <div className="diff-placeholder-text">Enter content on both sides to see the diff</div>
          </div>
        )}
      </div>
    </div>
  );
}
