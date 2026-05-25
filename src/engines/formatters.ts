import { format as sqlFormat } from 'sql-formatter';
import xmlFormat from 'xml-formatter';
import * as prettier from 'prettier';
import { marked } from 'marked';
import parserBabel from 'prettier/plugins/babel';
import parserHtml from 'prettier/plugins/html';
import parserCss from 'prettier/plugins/postcss';
import estree from 'prettier/plugins/estree';
import type { FormatType, SQLDialect, EncodeDecodeMode } from '../types';

let prettierReady = false;
async function ensurePrettier() {
  if (!prettierReady) {
    await prettier.format('', { parser: 'babel', plugins: [parserBabel, estree, parserHtml, parserCss] });
    prettierReady = true;
  }
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
        try {
          const formatted = xmlFormat(input, { indentation: '  ', collapseContent: true });
          return { output: formatted, error: null };
        } catch {
          const lines = input
            .replace(/>\s*</g, '>\n<')
            .split('\n');
          let depth = 0;
          const formatted = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            const closes = trimmed.startsWith('</');
            if (closes) depth--;
            const out = '  '.repeat(Math.max(0, depth)) + trimmed;
            if (!closes && !trimmed.endsWith('/>') && !trimmed.startsWith('<!--') && !trimmed.startsWith('<?')) {
              const tagName = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
              if (tagName) depth++;
            }
            return out;
          }).filter(Boolean).join('\n');
          return { output: formatted || input, error: null };
        }
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
      case 'javascript': {
        await ensurePrettier();
        const parserMap: Record<string, string> = {
          html: 'html',
          css: 'css',
          javascript: 'babel',
        };
        const parser = parserMap[format];
        if (mode === 'minify') {
          const result = await prettier.format(input, {
            parser,
            plugins: [parserBabel, estree, parserHtml, parserCss],
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
          plugins: [parserBabel, estree, parserHtml, parserCss],
          tabWidth: 2,
          useTabs: false,
          singleQuote: true,
          trailingComma: 'all',
          proseWrap: 'preserve',
        });
        return { output: result, error: null };
      }
      case 'markdown': {
        const html = await marked.parse(input);
        return { output: html, error: null };
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
      case 'properties': {
        const lines = input.split('\n');
        const entries: { key: string; value: string; comment: string; index: number }[] = [];
        let currentComment = '';
        for (let i = 0; i < lines.length; i++) {
          const raw = lines[i];
          const trimmed = raw.trim();
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            currentComment += (currentComment ? '\n' : '') + raw;
            continue;
          }
          const eqIdx = trimmed.indexOf('=');
          const colonIdx = trimmed.indexOf(':');
          const spaceIdx = trimmed.indexOf(' ');
          let sepIdx = -1;
          if (eqIdx >= 0) sepIdx = eqIdx;
          else if (colonIdx >= 0) sepIdx = colonIdx;
          else if (spaceIdx >= 0) sepIdx = spaceIdx;
          if (sepIdx < 0) {
            entries.push({ key: trimmed, value: '', comment: currentComment, index: i });
          } else {
            const key = trimmed.slice(0, sepIdx).trim();
            const value = trimmed.slice(sepIdx + 1).trim();
            entries.push({ key, value, comment: currentComment, index: i });
          }
          currentComment = '';
        }
        entries.sort((a, b) => a.key.localeCompare(b.key));
        const result = entries.map(e => {
          const comment = e.comment ? e.comment + '\n' : '';
          return `${comment}${e.key} = ${e.value}`;
        }).join('\n');
        return { output: result, error: null };
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
