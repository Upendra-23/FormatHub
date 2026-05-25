import { useState, useCallback } from 'react';
import type { FormatType, ValidationError, SQLDialect, EncodeDecodeMode, AppSection, ConverterId } from '../types';
import { FORMATS } from '../types';
import { formatContent } from '../engines/formatters';
import { validateContent } from '../engines/validators';
import { convertContent } from '../engines/converters';
import { detectFormat } from '../engines/detector';

export function useFormatter(section: AppSection = 'formatter') {
  const [format, setFormat] = useState<FormatType>('json');
  const [converterId, setConverterId] = useState<ConverterId>('xml-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [preview, setPreview] = useState(false);
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

    if (section === 'converter') {
      const result = await convertContent(input, converterId);
      setOutput(result.output);
      setFormatError(result.error);
      setErrors([]);
      return;
    }

    // Validate input first
    const validationErrors = await validateContent(input, format);
    setErrors(validationErrors);

    // Only format if validation passed
    if (validationErrors.length === 0) {
      const result = await formatContent(input, format, mode, sqlDialect, encodeDecodeMode);
      setOutput(result.output);
      setFormatError(result.error);
    } else {
      setOutput(input);
      setFormatError(null);
    }
  }, [input, format, mode, sqlDialect, encodeDecodeMode, section, converterId]);

  const handleFormatChange = useCallback((f: FormatType) => {
    setFormat(f);
    setMode('format');
    setPreview(false);
    setEncodeDecodeMode('decode');
    setErrors([]);
    setFormatError(null);
    setOutput('');
  }, []);

  const handleConverterChange = useCallback((id: ConverterId) => {
    setConverterId(id);
    setErrors([]);
    setFormatError(null);
    setOutput('');
  }, []);

  const handleModeChange = useCallback((m: 'format' | 'minify') => {
    setMode(m);
    if (m !== 'format') setPreview(false);
  }, []);

  const handlePreviewChange = useCallback((v: boolean) => {
    setPreview(v);
  }, []);

  const handleInputChange = useCallback((val: string) => {
    setInput(val);
    if (section !== 'converter') {
      const detected = detectFormat(val);
      if (detected && detected !== format) {
        setFormat(detected);
        setMode('format');
        setPreview(false);
        setEncodeDecodeMode('decode');
        setErrors([]);
        setFormatError(null);
        setOutput('');
      }
    }
  }, [format, section]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setErrors([]);
    setFormatError(null);
  }, []);

  return {
    format,
    converterId,
    input,
    output,
    mode,
    preview,
    errors,
    formatError,
    sqlDialect,
    encodeDecodeMode,
    currentFormat,
    setInput: handleInputChange,
    setFormat: handleFormatChange,
    setConverterId: handleConverterChange,
    setMode: handleModeChange,
    setPreview: handlePreviewChange,
    setSqlDialect,
    setEncodeDecodeMode,
    process,
    clearAll,
  };
}
