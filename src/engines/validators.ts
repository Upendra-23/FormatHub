import yaml from 'js-yaml';
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

function validateYAML(input: string): ValidationError[] {
  try {
    yaml.load(input);
    return [];
  } catch (err: unknown) {
    const parsed = parseErrorLine(err);
    let message = parsed.message;
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes('indentation') || msg.includes('indent')) {
      const lines = input.split('\n');
      const line = parsed.line - 1;
      if (line >= 0 && line < lines.length) {
        const ctx = lines[line].trim();
        message = `Indentation error near "${ctx}" — YAML uses consistent spaces for nesting`;
      } else {
        message = 'Indentation error — YAML uses consistent spaces for nesting';
      }
    } else if (msg.includes('did not find expected key') || msg.includes('mapping values')) {
      const lines = input.split('\n');
      const line = parsed.line - 1;
      if (line >= 0 && line < lines.length) {
        const ctx = lines[line].trim();
        message = `Invalid key-value mapping near "${ctx}" — expected "key: value" format`;
      } else {
        message = 'Invalid key-value mapping — expected "key: value" format';
      }
    } else if (msg.includes('did not find expected') || msg.includes('expected')) {
      const lines = input.split('\n');
      const line = parsed.line - 1;
      if (line >= 0 && line < lines.length) {
        const ctx = lines[line].trim();
        message = `Syntax error near "${ctx}"`;
      } else {
        message = `Syntax error — ${msg}`;
      }
    } else if (msg.includes('duplicate') || msg.includes('Duplicate')) {
      message = `Duplicate key found — ${msg}`;
    } else if (msg.includes('tab') || msg.includes('Tab')) {
      message = 'Tabs are not allowed in YAML — use spaces for indentation';
    }

    return [{ ...parsed, message, length: 1 }];
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

function validateHTML(input: string): ValidationError[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const errors = doc.querySelectorAll('parsererror');
    if (errors.length === 0) return [];
    const result: ValidationError[] = [];
    errors.forEach(e => {
      const text = e.textContent || '';
      const lineMatch = text.match(/line[:\s]+(\d+)/i);
      const colMatch = text.match(/column[:\s]+(\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
      const column = colMatch ? parseInt(colMatch[1], 10) : 1;
      let message = text.trim();
      if (message.includes('mismatched tag') || message.includes('expected')) {
        const tagMatch = message.match(/<([^>\s]+)/);
        if (tagMatch) {
          message = `Mismatched or unclosed tag: <${tagMatch[1]}>`;
        }
      }
      result.push({ line, column, message, length: 1 });
    });
    return result;
  } catch (err: unknown) {
    return [{ line: 1, column: 1, message: err instanceof Error ? err.message : String(err), length: 1 }];
  }
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

function validateTypeScript(input: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = input.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1] || '';
      if (inBlockComment) {
        if (ch === '*' && next === '/') { inBlockComment = false; j++; }
        continue;
      }
      if (ch === '/' && next === '*') { inBlockComment = true; j++; continue; }
      if (ch === '/' && next === '/') break;
      if (inSingleQuote) { if (ch === '\\') j++; else if (ch === "'") inSingleQuote = false; continue; }
      if (inDoubleQuote) { if (ch === '\\') j++; else if (ch === '"') inDoubleQuote = false; continue; }
      if (inBacktick) { if (ch === '\\') j++; else if (ch === '`') inBacktick = false; continue; }
      if (ch === "'") { inSingleQuote = true; continue; }
      if (ch === '"') { inDoubleQuote = true; continue; }
      if (ch === '`') { inBacktick = true; continue; }
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
      if (ch === '(') parenCount++;
      if (ch === ')') parenCount--;
      if (ch === '[') bracketCount++;
      if (ch === ']') bracketCount--;
    }
  }
  if (braceCount !== 0)
    errors.push({ line: lines.length, column: 1, message: braceCount > 0 ? `Unmatched opening brace` : `Extra closing brace`, length: 1 });
  if (parenCount !== 0)
    errors.push({ line: lines.length, column: 1, message: parenCount > 0 ? `Unmatched opening parenthesis` : `Extra closing parenthesis`, length: 1 });
  if (bracketCount !== 0)
    errors.push({ line: lines.length, column: 1, message: bracketCount > 0 ? `Unmatched opening bracket` : `Extra closing bracket`, length: 1 });
  if (inSingleQuote) errors.push({ line: lines.length, column: 1, message: `Unclosed single quote`, length: 1 });
  if (inDoubleQuote) errors.push({ line: lines.length, column: 1, message: `Unclosed double quote`, length: 1 });
  if (inBacktick) errors.push({ line: lines.length, column: 1, message: `Unclosed template literal`, length: 1 });
  if (inBlockComment) errors.push({ line: lines.length, column: 1, message: `Unclosed block comment`, length: 1 });
  return errors;
}

function validateJava(input: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = input.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBlockComment = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1] || '';
      if (inBlockComment) {
        if (ch === '*' && next === '/') { inBlockComment = false; j++; }
        continue;
      }
      if (ch === '/' && next === '*') { inBlockComment = true; j++; continue; }
      if (ch === '/' && next === '/') break;
      if (inSingleQuote) { if (ch === '\\') j++; else if (ch === "'") inSingleQuote = false; continue; }
      if (inDoubleQuote) { if (ch === '\\') j++; else if (ch === '"') inDoubleQuote = false; continue; }
      if (ch === "'") { inSingleQuote = true; continue; }
      if (ch === '"') { inDoubleQuote = true; continue; }
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
      if (ch === '(') parenCount++;
      if (ch === ')') parenCount--;
    }
  }
  if (braceCount !== 0)
    errors.push({ line: lines.length, column: 1, message: braceCount > 0 ? `Unmatched opening brace '{'` : `Extra closing brace '}'`, length: 1 });
  if (parenCount !== 0)
    errors.push({ line: lines.length, column: 1, message: parenCount > 0 ? `Unmatched opening parenthesis '('` : `Extra closing parenthesis ')'`, length: 1 });
  if (inSingleQuote) errors.push({ line: lines.length, column: 1, message: `Unclosed char literal (single quote)`, length: 1 });
  if (inDoubleQuote) errors.push({ line: lines.length, column: 1, message: `Unclosed string literal`, length: 1 });
  if (inBlockComment) errors.push({ line: lines.length, column: 1, message: `Unclosed block comment`, length: 1 });
  return errors;
}

function validateJavaScript(input: string): ValidationError[] {
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

function validateCSV(input: string): ValidationError[] {
  const lines = input.split('\n').filter(r => r.trim());
  const errors: ValidationError[] = [];
  let expectedCols = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let cols = 0;
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols++;
      }
    }
    if (!inQuotes) cols++;
    if (expectedCols === -1) {
      expectedCols = cols;
    } else if (cols !== expectedCols) {
      errors.push({
        line: i + 1,
        column: 1,
        message: `Column count mismatch: expected ${expectedCols} columns, got ${cols} at line ${i + 1}`,
        length: 1,
      });
    }
    if (inQuotes) {
      errors.push({
        line: i + 1,
        column: line.length,
        message: `Unclosed double quote at line ${i + 1} — missing closing " at end of field`,
        length: 1,
      });
    }
  }
  return errors;
}

function validateProperties(input: string): ValidationError[] {
  const lines = input.split('\n');
  const errors: ValidationError[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#') || line.startsWith(';') || line.startsWith('!')) continue;
    if (!line.includes('=') && !line.includes(':')) {
      errors.push({
        line: i + 1,
        column: 1,
        message: `Invalid property format at line ${i + 1}: "${line}" — expected key=value or key:value`,
        length: 1,
      });
    }
  }
  return errors;
}

export function validateContent(input: string, format: FormatType): ValidationError[] {
  if (!input.trim()) return [];
  switch (format) {
    case 'json': return validateJSON(input);
    case 'xml': return validateXML(input);
    case 'yaml': return validateYAML(input);
    case 'sql': return validateSQL(input);
    case 'html': return validateHTML(input);
    case 'css': return validateCSS(input);
    case 'javascript': return validateJavaScript(input);
    case 'typescript': return validateTypeScript(input);
    case 'java': return validateJava(input);
    case 'markdown': return [];
    case 'csv': return validateCSV(input);
    case 'properties': return validateProperties(input);
    default: return [];
  }
}
