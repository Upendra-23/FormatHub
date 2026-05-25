import { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFormatter } from './hooks/useFormatter';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Breadcrumb } from './components/Layout/Breadcrumb';
import { ToolPage } from './components/ToolPage/ToolPage';
import { Footer } from './components/Footer/Footer';
import { NAV_CATEGORIES } from './types';
import type { FormatType, AppSection, ConverterId } from './types';
import './App.css';

function deriveSection(toolId: string): AppSection {
  for (const cat of NAV_CATEGORIES) {
    const item = cat.items.find(i => i.value === toolId);
    if (item) return item.section;
  }
  return 'formatter';
}

export default function App() {
  const { theme, setTheme, monacoTheme } = useTheme();
  const [toolId, setToolId] = useState('json');
  const [fullscreen, setFullscreen] = useState(false);
  const section = deriveSection(toolId);
  const {
    format, converterId, input, output, mode, errors, formatError, sqlDialect, encodeDecodeMode,
    setInput, setFormat, setConverterId, setMode, setSqlDialect, setEncodeDecodeMode, process, clearAll,
  } = useFormatter(section);

  const handleToolChange = useCallback((id: string) => {
    setToolId(id);
    clearAll();
    const sec = deriveSection(id);
    if (sec === 'converter') {
      setConverterId(id as ConverterId);
    } else {
      setFormat(id as FormatType);
    }
  }, [setFormat, setConverterId, clearAll]);

  useEffect(() => {
    process();
  }, [process]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  return (
    <div className={`app${fullscreen ? ' fullscreen' : ''}`}>
      <Header
        theme={theme}
        onThemeChange={setTheme}
      />
      <div className="app-body">
        <Sidebar activeFormat={toolId} onSelect={handleToolChange} collapsed={false} />
        <main className="main-content">
          <div className="main-inner">
            <Breadcrumb format={toolId} />
            <ToolPage
              format={section === 'converter' ? 'json' : format}
              section={section}
              converterId={converterId}
              input={input}
              output={output}
              mode={mode}
              errors={errors}
              formatError={formatError}
              sqlDialect={sqlDialect}
              encodeDecodeMode={encodeDecodeMode}
              monacoTheme={monacoTheme}
              onInputChange={setInput}
              onModeChange={setMode}
              onSqlDialectChange={setSqlDialect}
              onEncodeDecodeModeChange={setEncodeDecodeMode}
              fullscreen={fullscreen}
              onToggleFullscreen={() => setFullscreen(f => !f)}
              onClear={clearAll}
            />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
