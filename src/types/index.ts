export type AppSection = 'formatter' | 'converter';

export type FormatType =
  | 'json' | 'xml' | 'sql' | 'html'
  | 'css' | 'javascript' | 'markdown'
  | 'base64' | 'url'
  | 'yaml' | 'csv' | 'properties';
   
export type ConverterId =
  | 'xml-to-json' | 'json-to-xml'
  | 'csv-to-json' | 'json-to-csv'
  | 'yaml-to-json' | 'json-to-yaml'
  | 'properties-to-yaml';

export type ActionMode = 'format' | 'minify';

export interface FormatOption {
  label: string;
  value: FormatType;
  supportsFormat: boolean;
  supportsMinify: boolean;
  language: string;
}

export const FORMATS: FormatOption[] = [
  { label: 'JSON', value: 'json', supportsFormat: true, supportsMinify: true, language: 'json' },
  { label: 'XML', value: 'xml', supportsFormat: true, supportsMinify: true, language: 'xml' },
  { label: 'HTML', value: 'html', supportsFormat: true, supportsMinify: true, language: 'html' },
  { label: 'SQL', value: 'sql', supportsFormat: true, supportsMinify: true, language: 'sql' },
  { label: 'CSS', value: 'css', supportsFormat: true, supportsMinify: true, language: 'css' },
  { label: 'JavaScript', value: 'javascript', supportsFormat: true, supportsMinify: true, language: 'javascript' },
  { label: 'Markdown', value: 'markdown', supportsFormat: true, supportsMinify: false, language: 'markdown' },
  { label: 'Base64', value: 'base64', supportsFormat: false, supportsMinify: false, language: 'plaintext' },
  { label: 'URL', value: 'url', supportsFormat: false, supportsMinify: false, language: 'plaintext' },
  { label: 'YAML', value: 'yaml', supportsFormat: false, supportsMinify: false, language: 'yaml' },
  { label: 'CSV', value: 'csv', supportsFormat: false, supportsMinify: false, language: 'csv' },
  { label: 'Properties', value: 'properties', supportsFormat: false, supportsMinify: false, language: 'properties' },
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

export type SQLDialect = 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';

export type EncodeDecodeMode = 'encode' | 'decode';

export interface NavItem {
  label: string;
  value: string;
  section: AppSection;
}

export interface ConverterDef {
  id: ConverterId;
  label: string;
  fromFormat: FormatType;
  toFormat: FormatType;
  fromLabel: string;
  toLabel: string;
}

export const CONVERTERS: ConverterDef[] = [
  { id: 'xml-to-json', label: 'XML to JSON Converter', fromFormat: 'xml', toFormat: 'json', fromLabel: 'XML', toLabel: 'JSON' },
  { id: 'json-to-xml', label: 'JSON to XML Converter', fromFormat: 'json', toFormat: 'xml', fromLabel: 'JSON', toLabel: 'XML' },
  { id: 'csv-to-json', label: 'CSV to JSON Converter', fromFormat: 'csv', toFormat: 'json', fromLabel: 'CSV', toLabel: 'JSON' },
  { id: 'json-to-csv', label: 'JSON to CSV Converter', fromFormat: 'json', toFormat: 'csv', fromLabel: 'JSON', toLabel: 'CSV' },
  { id: 'yaml-to-json', label: 'YAML to JSON Converter', fromFormat: 'yaml', toFormat: 'json', fromLabel: 'YAML', toLabel: 'JSON' },
  { id: 'json-to-yaml', label: 'JSON to YAML Converter', fromFormat: 'json', toFormat: 'yaml', fromLabel: 'JSON', toLabel: 'YAML' },
  { id: 'properties-to-yaml', label: 'Properties to YAML Converter', fromFormat: 'properties', toFormat: 'yaml', fromLabel: 'Properties', toLabel: 'YAML' },
];

export interface NavCategory {
  label: string;
  items: NavItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Formatters',
    items: [
      { label: 'JSON Formatter', value: 'json', section: 'formatter' },
      { label: 'XML Formatter', value: 'xml', section: 'formatter' },
      { label: 'HTML Formatter', value: 'html', section: 'formatter' },
      { label: 'SQL Formatter', value: 'sql', section: 'formatter' },
      { label: 'JavaScript Beautifier', value: 'javascript', section: 'formatter' },
      { label: 'CSS Beautifier', value: 'css', section: 'formatter' },
      { label: 'Markdown Preview', value: 'markdown', section: 'formatter' },
      { label: 'Base64 Encoder / Decoder', value: 'base64', section: 'formatter' },
      { label: 'URL Encoder / Decoder', value: 'url', section: 'formatter' },
      { label: 'Properties Formatter', value: 'properties', section: 'formatter' },
    ],
  },
  {
    label: 'Converters',
    items: [
      { label: 'XML to JSON Converter', value: 'xml-to-json', section: 'converter' },
      { label: 'JSON to XML Converter', value: 'json-to-xml', section: 'converter' },
      { label: 'CSV to JSON Converter', value: 'csv-to-json', section: 'converter' },
      { label: 'JSON to CSV Converter', value: 'json-to-csv', section: 'converter' },
      { label: 'YAML to JSON Converter', value: 'yaml-to-json', section: 'converter' },
      { label: 'JSON to YAML Converter', value: 'json-to-yaml', section: 'converter' },
      { label: 'Properties to YAML Converter', value: 'properties-to-yaml', section: 'converter' },
    ],
  },
];

export const TOOL_DESCRIPTIONS: Record<FormatType, { title: string; description: string }> = {
  json: {
    title: 'JSON Formatter',
    description: 'Formats and validates JSON strings against RFC 4627 with configurable indentation levels.',
  },
  xml: {
    title: 'XML Formatter',
    description: 'Formats and validates XML strings with per-element indentation for optimal readability.',
  },
  html: {
    title: 'HTML Formatter',
    description: 'Formats and validates HTML documents — checks for well-formedness and missing closing tags.',
  },
  sql: {
    title: 'SQL Formatter',
    description: 'Formats SQL queries with configurable indentation. Supports MySQL, PostgreSQL, Oracle, and SQL Server dialects.',
  },
  markdown: {
    title: 'Markdown Preview',
    description: 'Live preview of Markdown content with syntax highlighting and rendered HTML output.',
  },
  css: {
    title: 'CSS Beautifier / Minifier',
    description: 'Beautifies or minifies CSS stylesheets with configurable indentation levels.',
  },
  javascript: {
    title: 'JavaScript Beautifier / Minifier',
    description: 'Beautifies or minifies JavaScript code with configurable brace styles and indentation.',
  },
  base64: {
    title: 'Base64 Encoder / Decoder',
    description: 'Encodes or decodes strings to/from Base64 format as specified in RFC 4648.',
  },
  url: {
    title: 'URL Encoder / Decoder',
    description: 'Encodes or decodes strings to/from URL-compatible format as specified in RFC 1738.',
  },
  yaml: {
    title: 'YAML Converter',
    description: 'Converts YAML data to and from JSON format.',
  },
  csv: {
    title: 'CSV Converter',
    description: 'Converts CSV data to and from JSON format.',
  },
  properties: {
    title: 'Properties Formatter',
    description: 'Formats and sorts .properties files — ideal for Java/Spring application configuration.',
  },
};

export const CONVERTER_DESCRIPTIONS: Record<ConverterId, { title: string; description: string }> = {
  'xml-to-json': {
    title: 'XML to JSON Converter',
    description: 'Converts XML data into JSON format with configurable indentation.',
  },
  'json-to-xml': {
    title: 'JSON to XML Converter',
    description: 'Converts JSON data into XML format. Specify root element and array element names.',
  },
  'csv-to-json': {
    title: 'CSV to JSON Converter',
    description: 'Converts CSV data into JSON format. Each row becomes an array element.',
  },
  'json-to-csv': {
    title: 'JSON to CSV Converter',
    description: 'Converts JSON arrays into CSV format with proper column alignment.',
  },
  'yaml-to-json': {
    title: 'YAML to JSON Converter',
    description: 'Converts YAML data into JSON format with configurable indentation.',
  },
  'json-to-yaml': {
    title: 'JSON to YAML Converter',
    description: 'Converts JSON data into YAML format with clean indentation.',
  },
  'properties-to-yaml': {
    title: 'Properties to YAML Converter',
    description: 'Converts Java/Spring .properties files into YAML format suitable for application.yml.',
  },
};
