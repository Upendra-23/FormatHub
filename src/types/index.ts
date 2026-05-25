export type FormatType =
  | 'json' | 'xml' | 'yaml' | 'sql' | 'html'
  | 'css' | 'javascript' | 'typescript' | 'java'
  | 'markdown' | 'csv'
  | 'properties' | 'base64' | 'url';

export type ActionMode = 'format' | 'minify';

export interface FormatOption {
  label: string;
  value: FormatType;
  supportsFormat: boolean;
  supportsMinify: boolean;
  supportsValidate: boolean;
  language: string;
}

export const FORMATS: FormatOption[] = [
  { label: 'JSON', value: 'json', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'json' },
  { label: 'XML', value: 'xml', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'xml' },
  { label: 'YAML', value: 'yaml', supportsFormat: true, supportsMinify: false, supportsValidate: true, language: 'yaml' },
  { label: 'SQL', value: 'sql', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'sql' },
  { label: 'HTML', value: 'html', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'html' },
  { label: 'CSS', value: 'css', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'css' },
  { label: 'JavaScript', value: 'javascript', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'javascript' },
  { label: 'TypeScript', value: 'typescript', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'typescript' },
  { label: 'Java', value: 'java', supportsFormat: true, supportsMinify: true, supportsValidate: true, language: 'java' },
  { label: 'Markdown', value: 'markdown', supportsFormat: true, supportsMinify: false, supportsValidate: false, language: 'markdown' },
  { label: 'CSV', value: 'csv', supportsFormat: true, supportsMinify: false, supportsValidate: true, language: 'csv' },
  { label: 'Properties / INI', value: 'properties', supportsFormat: true, supportsMinify: false, supportsValidate: true, language: 'ini' },
  { label: 'Base64', value: 'base64', supportsFormat: false, supportsMinify: false, supportsValidate: false, language: 'plaintext' },
  { label: 'URL', value: 'url', supportsFormat: false, supportsMinify: false, supportsValidate: false, language: 'plaintext' },
];

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  length?: number;
}

export interface FormatResult {
  output: string;
  error: string | null;
}

export type Base64Action = 'encode' | 'decode';
export type URLAction = 'encode' | 'decode';
export type SQLDialect = 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';

export type EncodeDecodeMode = 'encode' | 'decode';
