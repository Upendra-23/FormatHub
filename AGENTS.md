# AGENTS.md — Formatter Studio

## Commands

| Command | What it runs |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` (typecheck + bundle) |
| `npm run lint` | `eslint .` |

## TypeScript gotchas

- **`verbatimModuleSyntax: true`** — all type-only imports MUST use `import type`. Using `import { SomeType }` for a type will fail the build.
- **`erasableSyntaxOnly: true`** — no `enum` keyword, no `namespace`. Use `const` objects or union types instead.
- **`noUnusedLocals` / `noUnusedParameters`** — both on; dead code = build error.

## Architecture

- Entrypoint: `src/main.tsx` → `src/App.tsx`. Single-page React 19 app, no router.
- No state library — `useFormatter` hook in `src/hooks/useFormatter.ts` owns all state (format, input, output, errors, mode).
- Processing is **automatic**: `useEffect` calls `process()` when format/input/mode/dialect/encodeDecodeMode changes. No button press needed for results to appear.
- Format-specific logic lives in `src/engines/`. Adding a format = update `src/types/index.ts` (FORMATS array) + `formatters.ts` + `validators.ts`.

## Format engine details

- **Prettier** is used for HTML/CSS/JS/Markdown. Plugins (`prettier/plugins/babel`, `html`, `postcss`, `markdown`, `estree`) are imported explicitly and passed to every `prettier.format()` call.
- **SQL**: dialect map: mysql→mysql, postgresql→postgresql, oracle→**plsql** (not `oracle`), sqlserver→tsql.
- **Base64/URL**: explicit encode/decode mode via `EncodeDecodeMode` toggle in toolbar. No auto-detection.
- **CSV/Properties**: custom parsers, no external library.
- **`new Function()`** is used for JS validation — will not parse ES module syntax (`import`/`export`).

## Error display

- Errors are pushed to Monaco via `editor.deltaDecorations()` (red squiggly + hover) and `monaco.editor.setModelMarkers()` (gutter markers + Problems panel).
- The `ErrorPanel` component below the editor mirrors the same errors as a flat list.
- `ValidationError` type carries `line`, `column`, `message`, optional `length`.

## Theme

- CSS variables driven by `[data-theme="dark"|"light"]` on `<html>`.
- Persisted in `localStorage` key `format-studio-theme`.
- Monaco theme follows: `vs-dark` / `vs`.

## Project structure

```
src/
  types/index.ts        # FormatType, ValidationError, FORMATS config, etc.
  engines/
    formatters.ts       # formatContent() — all format/minify/convert logic
    validators.ts       # validateContent() — per-format validation
  hooks/
    useFormatter.ts     # Core state: input, output, format, mode, errors, process()
    useTheme.ts         # Dark/light toggle + localStorage persistence
  components/
    Editor/             # InputEditor (Monaco), OutputPanel (read-only), SplitView (resizable)
    Toolbar/            # FormatSelector dropdown, mode toggles, action buttons
    ErrorPanel/         # Error list below the editor
```
