import * as prettier from 'prettier';
import parserBabel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import type { ValidationError, FormatType } from '../types';

function parseErrorLine(err: unknown): { line: number; column: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/line[:\s]+(\d+)/i);
  const colMatch = msg.match(/column[:\s]+(\d+)/i) || msg.match(/position[:\s]+(\d+)/i);
  const line = match ? parseInt(match[1], 10) : 1;
  const column = colMatch ? parseInt(colMatch[1], 10) : 1;
  return { line, column, message: msg };
}

function getContext(input: string, pos: number, maxLen = 25): string {
  if (pos < 0 || pos > input.length) return '';
  const start = Math.max(0, pos - maxLen);
  const end = Math.min(input.length, pos + maxLen);
  let ctx = input.slice(start, end);
  if (start > 0) ctx = '...' + ctx;
  if (end < input.length) ctx = ctx + '...';
  return ctx.replace(/\n/g, '\\n');
}

async function tryParseWithPrettier(
  input: string,
  parser: string,
  plugins: prettier.Plugin[],
): Promise<ValidationError[]> {
  try {
    await prettier.format(input, { parser, plugins });
    return [];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const locMatch = msg.match(/\((\d+):(\d+)\)/);
    const line = locMatch ? parseInt(locMatch[1], 10) : 1;
    const column = locMatch ? parseInt(locMatch[2], 10) : 1;
    let message = msg;
    if (msg.includes("SyntaxError")) {
      message = msg.replace(/^SyntaxError:\s*/, '');
    }
    return [{ line, column, message, length: 1 }];
  }
}

function validateJSON(input: string): ValidationError[] {
  try {
    JSON.parse(input);
    return [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const posMatch = msg.match(/position\s+(\d+)/);
    let line = 1, column = 1, pos = -1;

    if (posMatch) {
      pos = parseInt(posMatch[1], 10);
      const lines = input.slice(0, pos).split('\n');
      line = lines.length;
      column = (lines[lines.length - 1]?.length || 0) + 1;
    } else {
      const lineMatch = msg.match(/line[:\s]+(\d+)/i);
      const colMatch = msg.match(/column[:\s]+(\d+)/i);
      if (lineMatch) line = parseInt(lineMatch[1], 10);
      if (colMatch) column = parseInt(colMatch[1], 10);
    }

    let message: string;
    let length = 1;

    if (msg.includes('Unexpected end of JSON input')) {
      message = 'Unexpected end of input — missing closing brace or bracket';
      length = 1;
    } else if (msg.includes('Unexpected token') || msg.includes('unexpected token')) {
      const token = msg.match(/'([^']+)'/)?.[1] || '';
      if (token === '}') {
        const ctx = getContext(input, pos);
        message = `Extra closing brace '}' — check for unmatched brace near ${ctx}`;
      } else if (token === ']') {
        const ctx = getContext(input, pos);
        message = `Extra closing bracket ']' — check for unmatched bracket near ${ctx}`;
      } else if (token) {
        const ctx = getContext(input, pos);
        message = `Unexpected '${token}' near ${ctx}`;
      } else {
        message = msg;
      }
    } else if (msg.includes("Expected ',' or '}'")) {
      const ctx = getContext(input, pos);
      message = `Missing comma — expected ',' or '}' near ${ctx}`;
    } else if (msg.includes("Expected ',' or ']'")) {
      const ctx = getContext(input, pos);
      message = `Missing comma — expected ',' or ']' near ${ctx}`;
    } else if (msg.includes('Expected a property name')) {
      if (pos > 0) {
        const before = input.slice(0, pos).trimEnd();
        if (before.endsWith(',')) {
          message = 'Trailing comma not allowed in JSON — expected a property name';
        } else {
          message = 'Expected a property name (key)';
        }
      } else {
        message = 'Expected a property name';
      }
    } else if (msg.includes('Expected a JSON object') || msg.includes('Expected a JSON array')) {
      message = 'Expected a JSON object `{` or array `[` at the top level';
    } else if (msg.includes('Unexpected number')) {
      const ctx = getContext(input, pos);
      message = `Unexpected number — check for missing operator or comma near ${ctx}`;
    } else if (msg.includes('Unexpected string')) {
      const ctx = getContext(input, pos);
      message = `Unexpected string — missing colon ':' between key and value? near ${ctx}`;
    } else if (msg.includes('Bad control character') || msg.includes('bad control')) {
      const ctx = getContext(input, pos);
      message = `Invalid control character in string — use \\n, \\t, etc. instead near ${ctx}`;
    } else if (msg.includes('Invalid JSON') || msg.includes('JSON')) {
      message = msg;
    } else {
      message = msg;
    }

    return [{ line, column, message, length }];
  }
}

function validateXML(input: string): ValidationError[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'application/xml');
    const errors = doc.querySelectorAll('parsererror');
    if (errors.length === 0) return [];
    const result: ValidationError[] = [];
    errors.forEach(e => {
      const text = e.textContent || '';
      const lineMatch = text.match(/line[:\s]+(\d+)/i);
      const colMatch = text.match(/column[:\s]+(\d+)/i) || text.match(/col[:\s]*(\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      const column = colMatch ? parseInt(colMatch[1], 10) : 1;
      let message = text.replace(/^[\s\S]*?\n/, '').trim();

      if (message.includes('mismatched tag')) {
        const tagMatch = message.match(/'([^']+)'/g);
        if (tagMatch && tagMatch.length >= 2) {
          message = `Mismatched tag: <${tagMatch[0].replace(/'/g, '')}> closed with </${tagMatch[1].replace(/'/g, '')}>`;
        }
      } else if (message.includes('no element found')) {
        message = 'No root element found';
      } else if (message.includes('not well-formed')) {
        message = 'XML is not well-formed';
      }

      result.push({ line, column, message, length: 1 });
    });
    return result;
  } catch (err: unknown) {
    return [{ line: 1, column: 1, message: err instanceof Error ? err.message : String(err), length: 1 }];
  }
}

function validateSQL(input: string): ValidationError[] {
  const lines = input.split('\n');
  const errors: ValidationError[] = [];
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inString) {
        if (ch === '\\') { j++; continue; }
        if (ch === stringChar) inString = false;
      } else {
        if (ch === "'" || ch === '"') {
          inString = true;
          stringChar = ch;
        }
      }
    }
  }
  if (inString) {
    errors.push({
      line: lines.length,
      column: 1,
      message: `Unclosed ${stringChar === "'" ? 'single' : 'double'} quote string — missing closing ${stringChar}`,
      length: 1,
    });
  }
  return errors;
}

const HTML_VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const HTML_RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title']);

const AUTO_CLOSE: Record<string, Set<string>> = {
  li: new Set(['li', 'ul', 'ol']),
  p: new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'section', 'main',
    'header', 'footer', 'nav', 'article', 'aside', 'form', 'table',
    'fieldset', 'details', 'blockquote', 'pre', 'hr', 'body']),
  td: new Set(['td', 'th', 'tr', 'table']),
  th: new Set(['th', 'td', 'tr', 'table']),
  tr: new Set(['tr', 'tbody', 'thead', 'tfoot', 'table']),
  option: new Set(['option', 'select']),
  dt: new Set(['dt', 'dd']),
  dd: new Set(['dd', 'dt']),
  head: new Set(['head', 'body']),
  body: new Set(['body']),
  html: new Set(['html']),
};

function validateHTML(input: string): ValidationError[] {
  const errors: ValidationError[] = [];

  let pos = 0;
  let line = 1;
  let col = 1;

  function advance(n: number) {
    for (let i = 0; i < n && pos < input.length; i++) {
      if (input[pos] === '\n') { line++; col = 1; }
      else { col++; }
      pos++;
    }
  }

  function peek(n = 0): string { return input[pos + n] || ''; }

  function skipUntil(ch: string): string | null {
    const idx = input.indexOf(ch, pos);
    if (idx === -1) return null;
    const result = input.slice(pos, idx);
    advance(idx - pos);
    return result;
  }

  const tagStack: { tag: string; line: number; col: number }[] = [];
  let inRawText = false;

  function emit(l: number, c: number, message: string) {
    errors.push({ line: l, column: c, message, length: 1 });
  }

  function checkQuotes(cLine: number, cCol: number, attrPart: string, tag: string) {
    let inDq = false, inSq = false, escaped = false;
    for (let i = 0; i < attrPart.length; i++) {
      const ch = attrPart[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (ch === '"') { inDq = !inDq; continue; }
      if (ch === "'") { inSq = !inSq; continue; }
    }
    if (inDq) emit(cLine, cCol, `Unclosed double quote in <${tag}> tag attributes`);
    if (inSq) emit(cLine, cCol, `Unclosed single quote in <${tag}> tag attributes`);
  }

  while (pos < input.length) {
    const ch = peek();

    if (ch === '<' && peek(1) === '!') {
      if (input.slice(pos, pos + 4) === '<!--') {
        advance(4);
        const end = input.indexOf('-->', pos);
        if (end === -1) { emit(line, col, 'Unclosed comment'); break; }
        const commentLines = input.slice(pos, end).split('\n');
        line += commentLines.length - 1;
        col = commentLines.length > 1 ? commentLines[commentLines.length - 1].length + 1 : col + (end - pos);
        pos = end + 3;
      } else if (/^<!DOCTYPE\s/i.test(input.slice(pos))) {
        advance(9);
        const end = input.indexOf('>', pos);
        if (end === -1) { emit(line, col, 'Unclosed DOCTYPE'); break; }
        advance(end - pos + 1);
      } else {
        advance(1);
      }
      continue;
    }

    if (ch === '<' && peek(1) === '?') {
      const end = input.indexOf('?>', pos);
      if (end === -1) { emit(line, col, 'Unclosed processing instruction'); break; }
      advance(end - pos + 2);
      continue;
    }

    if (ch === '<' && peek(1) === '/') {
      advance(2);
      const cLine = line, cCol = col;
      const tagName = skipUntil('>');
      if (tagName === null) { emit(cLine, cCol, 'Unclosed tag'); break; }
      const tag = tagName.trim().split(/\s+/)[0].toLowerCase();
      advance(1);
      inRawText = false;

      if (HTML_VOID_ELEMENTS.has(tag)) {
        emit(cLine, cCol, `Void element <${tag}> must not have a closing tag`);
        continue;
      }

      if (tagStack.length === 0) {
        emit(cLine, cCol, `Unexpected closing tag </${tag}> — no matching open tag`);
        continue;
      }

      if (tagStack[tagStack.length - 1].tag === tag) {
        tagStack.pop();
        continue;
      }

      let matchIdx = -1;
      for (let i = tagStack.length - 1; i >= 0; i--) {
        if (tagStack[i].tag === tag) { matchIdx = i; break; }
      }

      if (matchIdx !== -1) {
        while (tagStack.length > matchIdx + 1) {
          const auto = tagStack.pop()!;
          const closers = AUTO_CLOSE[auto.tag];
          if (!closers || !closers.has(tag)) {
            emit(auto.line, auto.col, `Unclosed element <${auto.tag}> — missing closing tag`);
          }
        }
        tagStack.pop();
      } else {
        emit(cLine, cCol, `Unexpected closing tag </${tag}> — no matching open tag`);
        while (tagStack.length > 0) {
          const top = tagStack[tagStack.length - 1];
          const closers = AUTO_CLOSE[top.tag];
          if (closers && closers.has(tag)) {
            tagStack.pop();
          } else {
            break;
          }
        }
      }
      continue;
    }

    if (ch === '<') {
      advance(1);
      const cLine = line, cCol = col;
      const tagContent = skipUntil('>');

      if (tagContent === null) {
        emit(cLine, cCol, 'Unclosed tag — missing >');
        break;
      }

      const trimmed = tagContent.trim();
      if (trimmed.length === 0) {
        emit(cLine, cCol, 'Empty tag name');
        advance(1);
        continue;
      }

      const tagMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
      if (!tagMatch) {
        advance(1);
        continue;
      }

      const tag = tagMatch[1].toLowerCase();
      const rest = trimmed.slice(tagMatch[0].length);
      advance(1);

      while (tagStack.length > 0) {
        const top = tagStack[tagStack.length - 1].tag;
        const closers = AUTO_CLOSE[top];
        if (closers && closers.has(tag)) {
          tagStack.pop();
        } else {
          break;
        }
      }

      if (rest.endsWith('/')) {
        if (HTML_VOID_ELEMENTS.has(tag)) {
          const slashIdx = rest.lastIndexOf('/');
          checkQuotes(cLine, cCol, rest.slice(0, slashIdx), tag);
        } else {
          emit(cLine, cCol, `Non-void element <${tag}> should not self-close with />`);
        }
        continue;
      }

      if (HTML_VOID_ELEMENTS.has(tag)) {
        checkQuotes(cLine, cCol, trimmed, tag);
        continue;
      }

      if (HTML_RAW_TEXT_ELEMENTS.has(tag)) {
        tagStack.push({ tag, line: cLine, col: cCol });
        inRawText = true;
        const endTag = `</${tag}`;
        const endIdx = input.toLowerCase().indexOf(endTag, pos);
        if (endIdx === -1) {
          emit(cLine, cCol, `Unclosed <${tag}> element — missing </${tag}>`);
          break;
        }
        advance(endIdx - pos);
        continue;
      }

      tagStack.push({ tag, line: cLine, col: cCol });
      continue;
    }

    if (inRawText) {
      advance(1);
      continue;
    }

    advance(1);
  }

  if (pos >= input.length && tagStack.length > 0) {
    for (let i = tagStack.length - 1; i >= 0; i--) {
      emit(tagStack[i].line, tagStack[i].col, `Unclosed element <${tagStack[i].tag}> — missing closing tag`);
    }
  }

  return errors;
}

function validateCSS(input: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = input.split('\n');
  let braceCount = 0;
  let inComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1] || '';
      if (inComment) {
        if (ch === '*' && next === '/') {
          inComment = false;
          j++;
        }
        continue;
      }
      if (ch === '/' && next === '*') {
        inComment = true;
        j++;
        continue;
      }
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }
  }
  if (braceCount !== 0) {
    const line = lines.length;
    const msg = braceCount > 0
      ? `Unmatched opening brace — missing ${braceCount} closing brace(s) '}'`
      : `Unmatched closing brace — extra ${Math.abs(braceCount)} closing brace(s) '}'`;
    errors.push({ line, column: 1, message: msg, length: 1 });
  }
  return errors;
}

async function validateJavaScript(input: string): Promise<ValidationError[]> {
  const usesModuleSyntax = /\b(import\s+[\s\S]*?from\s+['"`]|export\s+(default\s+)?(class|function|const|let|var|interface|type|enum|namespace|abstract)\b|import\s*\(|\bimport\s+['"`])/.test(input);

  if (!usesModuleSyntax) {
    try {
      new Function(input);
      return [];
    } catch (err: unknown) {
      const parsed = parseErrorLine(err);
      const msg = err instanceof Error ? err.message : String(err);
      let message: string;
      const length = 1;

      if (msg.includes('Unexpected token')) {
        const token = msg.match(/'([^']+)'/)?.[1] || '';
        if (token === '}') {
          message = `Extra closing brace '}' — check for unclosed block or extra brace`;
        } else if (token === ')') {
          message = `Extra closing parenthesis ')' — check for mismatched parentheses`;
        } else if (token === ']') {
          message = `Extra closing bracket ']' — check for unclosed array or extra bracket`;
        } else if (token) {
          message = `Unexpected '${token}' — possible syntax error near this token`;
        } else {
          message = 'Unexpected token — possible syntax error';
        }
      } else if (msg.includes('Unexpected end of input')) {
        message = 'Unexpected end of input — missing closing brace, bracket, parenthesis, or semicolon';
      } else if (msg.includes('Unexpected identifier')) {
        message = 'Unexpected identifier — possibly missing a semicolon, comma, or operator';
      } else if (msg.includes('Unexpected number')) {
        message = 'Unexpected number — check for missing operator or comma';
      } else if (msg.includes('Unexpected string')) {
        message = 'Unexpected string literal — check for missing operator or comma';
      } else if (msg.includes('Expected ')) {
        message = msg;
      } else if (msg.includes('is not defined') || msg.includes('is not a function')) {
        message = msg;
      } else if (msg.includes('return') && msg.includes('outside') || msg.includes('illegal return')) {
        message = 'Return statement outside of function';
      } else if (msg.includes('Strict mode') || msg.includes('strict')) {
        message = msg;
      } else {
        message = msg;
      }

      return [{ ...parsed, message, length }];
    }
  }

  return tryParseWithPrettier(input, 'babel', [parserBabel, estree]);
}

export async function validateContent(input: string, format: FormatType): Promise<ValidationError[]> {
  if (!input.trim()) return [];
  switch (format) {
    case 'json': return validateJSON(input);
    case 'xml': return validateXML(input);
    case 'sql': return validateSQL(input);
    case 'html': return validateHTML(input);
    case 'css': return validateCSS(input);
    case 'javascript': return validateJavaScript(input);
    case 'markdown': return [];
    case 'base64': return [];
    case 'url': return [];
    default: return [];
  }
}
