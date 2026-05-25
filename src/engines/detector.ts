import type { FormatType } from '../types';

export function detectFormat(input: string): FormatType | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 3) return null;

  const firstLine = trimmed.split('\n')[0].trim();

  // XML — starts with < and has a matching closing tag or is self-closing
  if (/^\s*</.test(trimmed)) {
    try {
      const doc = new DOMParser().parseFromString(trimmed, 'application/xml');
      if (!doc.querySelector('parsererror')) return 'xml';
    } catch {
      // not XML
    }
  }

  // HTML — starts with <!DOCTYPE or <html
  if (/^<(?:!DOCTYPE\s+html|html\b)/i.test(trimmed)) return 'html';

  // JSON — must start with { or [ and parse successfully
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not JSON
    }
  }

  // SQL — SELECT/INSERT/UPDATE/DELETE/CREATE/DROP/ALTER/WITH at start
  if (/^\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+(?:TABLE|DATABASE|INDEX|VIEW)|DROP\s+(?:TABLE|DATABASE|INDEX|VIEW)|ALTER\s+TABLE|WITH\s+\w+\s+AS)\b/i.test(trimmed)) {
    return 'sql';
  }

  // Properties — key=value or key:value patterns, no braces
  if (/^[a-zA-Z][a-zA-Z0-9.]*\s*[=:]\s*\S/.test(firstLine) && !trimmed.includes('{')) {
    return 'properties';
  }

  // CSS — { } with property:value pattern
  if (trimmed.includes('{') && trimmed.includes('}') && /[a-z-]+\s*:\s*\S/.test(trimmed)) {
    if (!firstLine.startsWith('function') && !firstLine.startsWith('const ') && !firstLine.startsWith('let ')) {
      return 'css';
    }
  }

  // JavaScript — function/const/let/var at start
  if (/^\s*(?:function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|import\s+|export\s+(?:default\s+)?(?:function|class|const|let|var))\b/.test(firstLine)) {
    return 'javascript';
  }

  return null;
}
