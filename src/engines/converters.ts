import yaml from 'js-yaml';
import type { ConverterId } from '../types';

function xmlNodeToJson(node: Element): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  for (const attr of node.attributes) {
    obj[`@${attr.name}`] = attr.value;
  }

  const children: Element[] = [];
  for (const child of node.children) {
    children.push(child);
  }

  if (children.length > 0) {
    const childCounts: Record<string, number> = {};
    for (const child of children) {
      childCounts[child.tagName] = (childCounts[child.tagName] || 0) + 1;
    }
    const groups: Record<string, unknown[]> = {};
    for (const child of children) {
      const tag = child.tagName;
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(xmlNodeToJson(child));
    }
    for (const [tag, items] of Object.entries(groups)) {
      obj[tag] = childCounts[tag] > 1 ? items : items[0];
    }
  }

  // Only use text content when element has no child elements
  if (children.length === 0) {
    const text = node.textContent?.trim() || '';
    if (text) {
      return text as unknown as Record<string, unknown>;
    }
  }

  return obj;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function jsonToXml(obj: unknown, name: string, depth = 0): string {
  const indent = '  '.repeat(depth);

  if (obj === null || obj === undefined) {
    return `${indent}<${name}/>`;
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return `${indent}<${name}>${escapeXml(String(obj))}</${name}>`;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, name, depth)).join('\n');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>);
    if (keys.length === 0) return `${indent}<${name}/>`;

    const attrs: string[] = [];
    const children: string[] = [];
    let textContent: string | null = null;

    for (const key of keys) {
      const value = (obj as Record<string, unknown>)[key];
      if (key.startsWith('@')) {
        const attrName = key.slice(1);
        if (attrName) {
          attrs.push(` ${attrName}="${escapeXml(String(value))}"`);
        }
      } else if (key === '#text') {
        textContent = escapeXml(String(value));
      } else {
        children.push(jsonToXml(value, key, depth + 1));
      }
    }

    const attrStr = attrs.join('');

    if (children.length === 0 && textContent !== null) {
      return `${indent}<${name}${attrStr}>${textContent}</${name}>`;
    }

    if (children.length === 0) {
      return `${indent}<${name}${attrStr}/>`;
    }

    const childStr = children.join('\n');
    return `${indent}<${name}${attrStr}>\n${childStr}\n${indent}</${name}>`;
  }

  return `${indent}<${name}>${escapeXml(String(obj))}</${name}>`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

function toCsvValue(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function convertContent(
  input: string,
  converterId: ConverterId,
): Promise<{ output: string; error: string | null }> {
  if (!input.trim()) return { output: '', error: null };

  try {
    switch (converterId) {
      case 'xml-to-json': {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, 'text/xml');
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
          return { output: input, error: parseError.textContent ?? 'XML parse error' };
        }
        const root = doc.documentElement;
        const result = xmlNodeToJson(root);
        return { output: JSON.stringify(result, null, 2), error: null };
      }

      case 'json-to-xml': {
        const parsed = JSON.parse(input);
        const xml = jsonToXml(parsed, 'root');
        return { output: xml, error: null };
      }

      case 'csv-to-json': {
        const lines = input.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          return { output: input, error: 'CSV must have at least a header row and one data row' };
        }
        const headers = parseCsvLine(lines[0]);
        const result: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const fields = parseCsvLine(lines[i]);
          const row: Record<string, string> = {};
          for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = fields[j] ?? '';
          }
          result.push(row);
        }
        return { output: JSON.stringify(result, null, 2), error: null };
      }

      case 'json-to-csv': {
        const arr = JSON.parse(input);
        if (!Array.isArray(arr) || arr.length === 0) {
          return { output: input, error: 'Input must be a non-empty JSON array' };
        }
        const headers = Object.keys(arr[0]);
        const lines: string[] = [headers.map(toCsvValue).join(',')];
        for (const row of arr) {
          const values = headers.map(h => toCsvValue(row[h]));
          lines.push(values.join(','));
        }
        return { output: lines.join('\n'), error: null };
      }

      case 'yaml-to-json': {
        const doc = yaml.load(input);
        return { output: JSON.stringify(doc, null, 2), error: null };
      }

      case 'json-to-yaml': {
        const doc = JSON.parse(input);
        return { output: yaml.dump(doc, { indent: 2, lineWidth: -1, noRefs: true }), error: null };
      }

      case 'properties-to-yaml': {
        const lines = input.split('\n');
        const result: Record<string, unknown> = {};
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
          const eqIdx = trimmed.indexOf('=');
          const colonIdx = trimmed.indexOf(':');
          const spaceIdx = trimmed.indexOf(' ');
          let sepIdx = -1;
          if (eqIdx >= 0) sepIdx = eqIdx;
          else if (colonIdx >= 0) sepIdx = colonIdx;
          else if (spaceIdx >= 0) sepIdx = spaceIdx;
          if (sepIdx < 0) continue;
          const key = trimmed.slice(0, sepIdx).trim();
          const value = trimmed.slice(sepIdx + 1).trim();
          const parts = key.split('.');
          let current = result;
          for (let j = 0; j < parts.length - 1; j++) {
            const part = parts[j];
            if (!(part in current)) {
              current[part] = {};
            }
            current = current[part] as Record<string, unknown>;
          }
          current[parts[parts.length - 1]] = value;
        }
        return { output: yaml.dump(result, { indent: 2, lineWidth: -1, noRefs: true }), error: null };
      }

      case 'yaml-to-properties': {
        const doc = yaml.load(input);
        if (typeof doc !== 'object' || doc === null) {
          return { output: input, error: 'YAML input must be an object' };
        }
        const lines: string[] = [];
        function flatten(obj: unknown, prefix: string) {
          if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
            for (const [key, value] of Object.entries(obj)) {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0) {
                flatten(value, fullKey);
              } else {
                lines.push(`${fullKey}=${value === null ? '' : String(value)}`);
              }
            }
          } else {
            lines.push(`${prefix}=${obj === null ? '' : String(obj)}`);
          }
        }
        flatten(doc, '');
        return { output: lines.join('\n'), error: null };
      }

      default:
        return { output: input, error: 'Unknown converter' };
    }
  } catch (err: unknown) {
    return { output: input, error: err instanceof Error ? err.message : String(err) };
  }
}
