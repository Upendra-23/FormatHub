import { loader } from '@monaco-editor/react';

const MONOKAI_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '88846f', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'f92672' },
    { token: 'keyword.control', foreground: 'f92672' },
    { token: 'string', foreground: 'e6db74' },
    { token: 'string.quoted', foreground: 'e6db74' },
    { token: 'number', foreground: 'ae81ff' },
    { token: 'type', foreground: '66d9ef' },
    { token: 'type.identifier', foreground: '66d9ef' },
    { token: 'delimiter', foreground: 'f8f8f2' },
    { token: 'tag', foreground: 'f92672' },
    { token: 'attribute.name', foreground: 'a6e22e' },
    { token: 'attribute.value', foreground: 'e6db74' },
    { token: 'function', foreground: 'a6e22e' },
    { token: 'function.identifier', foreground: 'a6e22e' },
    { token: 'variable', foreground: 'f8f8f2' },
    { token: 'constant', foreground: 'ae81ff' },
    { token: 'constant.numeric', foreground: 'ae81ff' },
    { token: 'operator', foreground: 'f92672' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editor.inactiveSelectionBackground': '#3e3d32',
    'editor.selectionBackground': '#49483e',
    'editor.selectionHighlightBackground': '#49483e88',
    'editor.wordHighlightBackground': '#49483e88',
    'editor.lineHighlightBackground': '#3e3d32',
    'editorCursor.foreground': '#f8f8f0',
    'editorWhitespace.foreground': '#49483e',
    'editorIndentGuide.background': '#49483e',
    'editorIndentGuide.activeBackground': '#5a5a4a',
    'editorLineNumber.foreground': '#88846f',
    'editorGutter.background': '#272822',
    'editor.selectionHighlightBorder': '#49483e',
  },
};

const DARUCULA_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '808080', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'cc7832' },
    { token: 'keyword.control', foreground: 'cc7832' },
    { token: 'string', foreground: '6a8759' },
    { token: 'string.quoted', foreground: '6a8759' },
    { token: 'number', foreground: '6897bb' },
    { token: 'type', foreground: 'cc7832' },
    { token: 'type.identifier', foreground: 'cc7832' },
    { token: 'delimiter', foreground: 'a9b7c6' },
    { token: 'tag', foreground: 'cc7832' },
    { token: 'attribute.name', foreground: 'a9b7c6' },
    { token: 'attribute.value', foreground: '6a8759' },
    { token: 'function', foreground: 'ffc66d' },
    { token: 'function.identifier', foreground: 'ffc66d' },
    { token: 'variable', foreground: 'a9b7c6' },
    { token: 'constant', foreground: '6897bb' },
    { token: 'constant.numeric', foreground: '6897bb' },
    { token: 'operator', foreground: 'a9b7c6' },
  ],
  colors: {
    'editor.background': '#2b2b2b',
    'editor.foreground': '#a9b7c6',
    'editor.inactiveSelectionBackground': '#3c3f41',
    'editor.selectionBackground': '#214283',
    'editor.selectionHighlightBackground': '#21428388',
    'editor.wordHighlightBackground': '#21428388',
    'editor.lineHighlightBackground': '#323232',
    'editorCursor.foreground': '#bbbbbb',
    'editorWhitespace.foreground': '#4e5254',
    'editorIndentGuide.background': '#4e5254',
    'editorIndentGuide.activeBackground': '#5e6264',
    'editorLineNumber.foreground': '#808080',
    'editorGutter.background': '#2b2b2b',
    'editor.selectionHighlightBorder': '#214283',
  },
};

export const MONACO_THEME_MAP: Record<string, string> = {
  light: 'vs',
  dark: 'vs-dark',
  monokai: 'monokai',
  darcula: 'darcula',
};

loader.init().then(monaco => {
  monaco.editor.defineTheme('monokai', MONOKAI_THEME);
  monaco.editor.defineTheme('darcula', DARUCULA_THEME);
});
