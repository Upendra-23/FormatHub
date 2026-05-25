import yaml from 'js-yaml';
import { format as sqlFormat } from 'sql-formatter';
import xmlFormat from 'xml-formatter';
import * as prettier from 'prettier';
import parserBabel from 'prettier/plugins/babel';
import parserHtml from 'prettier/plugins/html';
import parserCss from 'prettier/plugins/postcss';
import parserMarkdown from 'prettier/plugins/markdown';
import parserTypescript from 'prettier/plugins/typescript';
import estree from 'prettier/plugins/estree';
import prettierPluginJava from 'prettier-plugin-java';
import type { FormatType, SQLDialect, EncodeDecodeMode } from '../types';

let prettierReady = false;
async function ensurePrettier() {
  if (!prettierReady) {
    await prettier.format('', { parser: 'babel', plugins: [parserBabel, estree, parserTypescript, parserHtml, parserCss, parserMarkdown, prettierPluginJava] });
    prettierReady = true;
  }
}

function formatProperties(input: string): string {
  const lines = input.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      result.push(trimmed || '');
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        result.push(`${key}=${val}`);
      } else {
        result.push(trimmed);
      }
    } else {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result.push(`${key}=${val}`);
    }
  }
  return result.join('\n');
}

function formatCSV(input: string): string {
  const rows = input.split('\n').map(r => r.trim()).filter(r => r);
  if (rows.length === 0) return '';
  const parsed = rows.map(r => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < r.length; i++) {
      const ch = r[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < r.length && r[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
  const maxCols = Math.max(...parsed.map(r => r.length));
  const colWidths = Array(maxCols).fill(0);
  for (const row of parsed) {
    for (let i = 0; i < row.length; i++) {
      const val = row[i].includes(',') || row[i].includes('"') ? `"${row[i].replace(/"/g, '""')}"` : row[i];
      colWidths[i] = Math.max(colWidths[i], val.length);
    }
  }
  return parsed.map(row => {
    return row.map((cell, i) => {
      const val = cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell;
      return i < colWidths.length ? val.padEnd(colWidths[i]) : val;
    }).join(', ');
  }).join('\n');
}

export async function formatContent(
  input: string,
  format: FormatType,
  mode: 'format' | 'minify',
  sqlDialect?: SQLDialect,
  encodeDecodeMode?: EncodeDecodeMode,
): Promise<{ output: string; error: string | null }> {
  if (!input.trim()) return { output: '', error: null };

  try {
    switch (format) {
      case 'json': {
        const parsed = JSON.parse(input);
        if (mode === 'minify') {
          return { output: JSON.stringify(parsed), error: null };
        }
        return { output: JSON.stringify(parsed, null, 2), error: null };
      }
      case 'xml': {
        if (mode === 'minify') {
          const minified = input.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
          return { output: minified, error: null };
        }
        const formatted = xmlFormat(input, { indentation: '  ', collapseContent: true });
        return { output: formatted, error: null };
      }
      case 'yaml': {
        const doc = yaml.load(input);
        return { output: yaml.dump(doc, { indent: 2, lineWidth: -1, noRefs: true }), error: null };
      }
      case 'sql': {
        const dialectMap = {
          mysql: 'mysql',
          postgresql: 'postgresql',
          oracle: 'plsql',
          sqlserver: 'tsql',
        } as const;
        if (mode === 'minify') {
          const minified = input
            .replace(/--[^\n]*/g, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([(),;.])\s*/g, '$1')
            .trim();
          return { output: minified, error: null };
        }
        const formatted = sqlFormat(input, {
          language: dialectMap[sqlDialect || 'mysql'] || 'mysql',
          indentStyle: 'standard',
          keywordCase: 'upper',
          linesBetweenQueries: 2,
        });
        return { output: formatted, error: null };
      }
      case 'html':
      case 'css':
      case 'javascript':
      case 'typescript':
      case 'markdown': {
        await ensurePrettier();
        const parserMap: Record<string, string> = {
          html: 'html',
          css: 'css',
          javascript: 'babel',
          typescript: 'typescript',
          markdown: 'markdown',
        };
        const parser = parserMap[format];
        if (mode === 'minify' && format !== 'markdown') {
          const result = await prettier.format(input, {
            parser,
            plugins: [parserBabel, estree, parserHtml, parserCss, parserMarkdown],
            printWidth: Infinity,
            tabWidth: 0,
            useTabs: false,
            singleQuote: true,
            trailingComma: 'none',
          });
          const minified = result
            .replace(/\n\s*/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/\s{2,}/g, ' ')
            .trim();
          return { output: minified, error: null };
        }
        const result = await prettier.format(input, {
          parser,
          plugins: [parserBabel, estree, parserHtml, parserCss, parserMarkdown],
          tabWidth: 2,
          useTabs: false,
          singleQuote: true,
          trailingComma: 'all',
          proseWrap: 'preserve',
        });
        return { output: result, error: null };
      }
      case 'java': {
        await ensurePrettier();
        if (mode === 'minify') {
          const result = await prettier.format(input, {
            parser: 'java',
            plugins: [parserBabel, estree, parserTypescript, parserHtml, parserCss, parserMarkdown, prettierPluginJava],
            printWidth: Infinity,
            tabWidth: 0,
            useTabs: false,
          });
          const minified = result.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
          return { output: minified, error: null };
        }
        const result = await prettier.format(input, {
          parser: 'java',
          plugins: [parserBabel, estree, parserTypescript, parserHtml, parserCss, parserMarkdown, prettierPluginJava],
          tabWidth: 4,
          useTabs: false,
        });
        return { output: result, error: null };
      }
      case 'csv': {
        return { output: formatCSV(input), error: null };
      }
      case 'properties': {
        return { output: formatProperties(input), error: null };
      }
      case 'base64': {
        if (encodeDecodeMode === 'encode') {
          return { output: btoa(input), error: null };
        }
        try {
          return { output: atob(input.trim()), error: null };
        } catch (e: unknown) {
          return { output: input, error: `Cannot decode Base64: ${e instanceof Error ? e.message : String(e)}` };
        }
      }
      case 'url': {
        if (encodeDecodeMode === 'encode') {
          return { output: encodeURIComponent(input), error: null };
        }
        try {
          return { output: decodeURIComponent(input.trim()), error: null };
        } catch (e: unknown) {
          return { output: input, error: `Cannot decode URL: ${e instanceof Error ? e.message : String(e)}` };
        }
      }
      default:
        return { output: input, error: 'Unsupported format' };
    }
  } catch (err: unknown) {
    return { output: input, error: err instanceof Error ? err.message : 'Formatting error' };
  }
}
