import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from './hooks/useTheme';
import { useFormatter } from './hooks/useFormatter';
import { Background } from './components/Background';
import { CommandPalette } from './components/CommandPalette';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ToolPage } from './components/ToolPage/ToolPage';
import { DiffView } from './components/DiffView/DiffView';
import { Footer } from './components/Footer/Footer';
import { NAV_CATEGORIES } from './types';
import type { FormatType, AppSection, ConverterId } from './types';
import './App.css';

const DEFAULT_SAMPLES: Record<string, string> = {
  json: JSON.stringify({ name: 'Formatter Studio', version: '2.0', features: ['format', 'validate', 'convert'] }, null, 2),
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <note>\n    <to>User</to>\n    <from>FormatStudio</from>\n    <heading>Welcome</heading>\n    <body>Try formatting this XML.</body>\n  </note>\n</root>',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Welcome to FormatHub.</p>\n</body>\n</html>',
  sql: 'SELECT u.name, u.email, COUNT(o.id) AS orders\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = 1\n  AND o.created_at > \'2024-01-01\'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(o.id) > 0\nORDER BY orders DESC\nLIMIT 10;',
  javascript: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconst result = fibonacci(10);\nconsole.log(result);',
  css: '.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1.5rem;\n  padding: 2rem;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  border-radius: 12px;\n}\n\n.item {\n  padding: 1rem;\n  background: rgba(255, 255, 255, 0.9);\n  border-radius: 8px;\n  transition: transform 0.2s ease;\n}\n\n.item:hover {\n  transform: translateY(-2px);\n}',
  markdown: '# Welcome to FormatHub\n\n## Markdown Preview\n\nFormatHub supports **bold**, *italic*, and `code`.\n\n### Features\n\n- Real-time Markdown rendering\n- Syntax highlighting\n- Live preview\n\n```javascript\nconst msg = "Hello, World!";\nconsole.log(msg);\n```',
  base64: 'Hello, FormatHub! Encode or decode this text to/from Base64.',
  url: 'name=John Doe&message=Hello World&redirect=/dashboard',
  yaml: 'name: FormatHub\nversion: 2.0\nfeatures:\n  - format\n  - validate\n  - convert',
  csv: 'name,email,role\nAlice,alice@example.com,Developer\nBob,bob@example.com,Designer\nCarol,carol@example.com,Manager',
  'xml-to-json': '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <person>\n    <name>Alice</name>\n    <age>30</age>\n    <active>true</active>\n  </person>\n</root>',
  'json-to-xml': JSON.stringify({ root: { person: { name: 'Alice', age: 30, active: true } } }, null, 2),
  'csv-to-json': 'name,age,city\nAlice,30,New York\nBob,25,San Francisco',
  'json-to-csv': JSON.stringify([{ name: 'Alice', age: 30, city: 'New York' }, { name: 'Bob', age: 25, city: 'San Francisco' }], null, 2),
  'yaml-to-json': 'name: Alice\nage: 30\ncity: New York',
  'json-to-yaml': JSON.stringify({ name: 'Alice', age: 30, city: 'New York' }, null, 2),
  properties: '# Application configuration\napp.name=FormatHub\napp.version=2.0\napp.features=format,validate,convert\nspring.datasource.url=jdbc:postgresql://localhost:5432/formathub\nspring.datasource.username=admin\nspring.datasource.password=\nserver.port=8080\nlogging.level.root=INFO\nlogging.level.com.formathub=DEBUG',
  'properties-to-yaml': '# Application configuration\napp.name=FormatHub\napp.version=2.0\napp.features=format,validate,convert\nspring.datasource.url=jdbc:postgresql://localhost:5432/formathub\nspring.datasource.username=admin\nspring.datasource.password=\nserver.port=8080\nlogging.level.root=INFO\nlogging.level.com.formathub=DEBUG',
  'yaml-to-properties': 'app:\n  name: FormatHub\n  version: 2.0\n  features: format,validate,convert\nspring:\n  datasource:\n    url: jdbc:postgresql://localhost:5432/formathub\n    username: admin\n    password: \'\'\nserver:\n  port: 8080\nlogging:\n  level:\n    root: INFO\n    com:\n      formathub: DEBUG',
};

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const section = deriveSection(toolId);

  const {
    format, converterId, input, output, mode, errors, formatError, sqlDialect, encodeDecodeMode,
    setInput, setFormat, setConverterId, setMode, setSqlDialect, setEncodeDecodeMode, process, clearAll,
  } = useFormatter(section);

  const handleToolChange = useCallback((id: string) => {
    setToolId(id);
    const sec = deriveSection(id);
    if (sec === 'converter') {
      setConverterId(id as ConverterId);
    } else if (sec !== 'diff') {
      setFormat(id as FormatType);
    }
    setInput(DEFAULT_SAMPLES[id] || '');
  }, [setFormat, setConverterId, setInput]);

  const initialLoad = useRef(true);
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      setInput(DEFAULT_SAMPLES.json);
    }
  }, [setInput]);

  useEffect(() => {
    if (section !== 'diff') process();
  }, [process, section]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const cmdItems = NAV_CATEGORIES.flatMap(cat =>
    cat.items.map(item => ({
      id: item.value,
      label: `${item.label}`,
      icon: item.section === 'converter' ? '\u21C4' : '\u270E',
      action: () => handleToolChange(item.value),
    }))
  );

  const isDiff = section === 'diff';
  const lineCount = isDiff ? 0 : (input ? input.split('\n').length : 0);
  const charCount = isDiff ? 0 : input.length;

  return (
    <div className={`app${fullscreen ? ' fullscreen' : ''}`}>
      <Background />
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        items={cmdItems}
      />
      <Header
        theme={theme}
        onThemeChange={setTheme}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
      />
      <div className="app-body">
        <Sidebar activeFormat={toolId} onSelect={handleToolChange} collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
        <main className="main-content">
          <div className="main-inner">
            {isDiff ? (
              <DiffView monacoTheme={monacoTheme} fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen(f => !f)} />
            ) : (
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
            )}
          </div>
        </main>
      </div>
      <Footer
        format={format}
        mode={mode}
        lineCount={lineCount}
        charCount={charCount}
        section={section}
      />
    </div>
  );
}
