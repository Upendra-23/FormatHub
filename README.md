# FormatHub

A browser-based code formatter and validator — format, minify, and validate code in multiple languages right in your browser. No server needed.

## Features

- **Multi-language support**: JSON, XML, YAML, SQL, HTML, CSS, JavaScript, TypeScript, Java, Markdown, CSV, Properties/INI, Base64, URL
- **Format & Minify**: Toggle between formatted output and minified/compressed versions
- **Real-time validation**: Syntax errors highlighted inline with descriptive messages
- **SQL dialect support**: MySQL, PostgreSQL, Oracle, SQL Server
- **Encode/Decode**: Base64 and URL encode/decode modes
- **Monaco editor**: Powered by the same engine as VS Code — syntax highlighting, line numbers, and more
- **Dark & light themes**: Multiple editor themes (Light, Dark, Monokai, Darcula)
- **Fully client-side**: All processing happens in-browser via WebAssembly and JavaScript libraries

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Build | Vite 8 |
| Editor | Monaco Editor (via @monaco-editor/react) |
| Formatting | Prettier, sql-formatter, xml-formatter, js-yaml, prettier-plugin-java |
| Validation | Custom validators + DOMParser |
| Styling | CSS with CSS variables for theming |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Architecture

```
src/
  types/index.ts         # Format definitions, type exports
  engines/
    formatters.ts        # All format/minify/encode logic
    validators.ts        # Per-format validation
  hooks/
    useFormatter.ts      # Core state management
    useTheme.ts          # Theme persistence
  components/
    Editor/              # Monaco input/output editors
    Toolbar/             # Format selector, mode toggles, actions
    ErrorPanel/          # Error display below editor
```

Adding a new format requires updating `FORMATS` in `src/types/index.ts`, adding a case in `formatters.ts`, and adding a validator in `validators.ts`.
