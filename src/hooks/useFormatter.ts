import { useState, useCallback } from 'react';
import type { FormatType, ValidationError, SQLDialect, EncodeDecodeMode } from '../types';
import { FORMATS } from '../types';
import { formatContent } from '../engines/formatters';
import { validateContent } from '../engines/validators';

export function useFormatter() {
  const [format, setFormat] = useState<FormatType>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [sqlDialect, setSqlDialect] = useState<SQLDialect>('mysql');
  const [encodeDecodeMode, setEncodeDecodeMode] = useState<EncodeDecodeMode>('decode');

  const currentFormat = FORMATS.find(f => f.value === format)!;

  const process = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setErrors([]);
      setFormatError(null);
      return;
    }

    const validationErrors = validateContent(input, format);
    setErrors(validationErrors);

    const result = await formatContent(input, format, mode, sqlDialect, encodeDecodeMode);
    setOutput(result.output);
    setFormatError(result.error);
  }, [input, format, mode, sqlDialect, encodeDecodeMode]);

  const handleFormatChange = useCallback((f: FormatType) => {
    setFormat(f);
    setMode('format');
    setEncodeDecodeMode('decode');
    setErrors([]);
    setFormatError(null);
    setOutput('');
  }, []);

  const handleModeChange = useCallback((m: 'format' | 'minify') => {
    setMode(m);
  }, []);

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
  }, []);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setErrors([]);
    setFormatError(null);
  }, []);

  return {
    format,
    input,
    output,
    mode,
    errors,
    formatError,
    sqlDialect,
    encodeDecodeMode,
    currentFormat,
    setInput: handleInputChange,
    setFormat: handleFormatChange,
    setMode: handleModeChange,
    setSqlDialect,
    setEncodeDecodeMode,
    process,
    clearAll,
  };
}
