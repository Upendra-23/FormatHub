import { useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFormatter } from './hooks/useFormatter';
import { Toolbar } from './components/Toolbar/Toolbar';
import { SplitView } from './components/Editor/SplitView';
import { ErrorPanel } from './components/ErrorPanel/ErrorPanel';
import { Footer } from './components/Footer/Footer';
import './editor/themes';
import './App.css';

export default function App() {
  const { theme, setTheme, monacoTheme } = useTheme();
  const {
    format, input, output, mode, errors, formatError, sqlDialect, encodeDecodeMode,
    setInput, setFormat, setMode, setSqlDialect, setEncodeDecodeMode, process, clearAll,
  } = useFormatter();

  useEffect(() => {
    process();
  }, [process]);

  return (
    <div className="app">
      <Toolbar
        format={format}
        mode={mode}
        sqlDialect={sqlDialect}
        encodeDecodeMode={encodeDecodeMode}
        onFormatChange={setFormat}
        onModeChange={setMode}
        onSqlDialectChange={setSqlDialect}
        onEncodeDecodeModeChange={setEncodeDecodeMode}
        onProcess={process}
        onClear={clearAll}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="main-content">
        <SplitView
          input={input}
          output={output}
          format={format}
          errors={errors}
          monacoTheme={monacoTheme}
          onInputChange={setInput}
        />
      </main>
      <ErrorPanel errors={errors} formatError={formatError} />
      <Footer />
    </div>
  );
}
