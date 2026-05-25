import { useRef, useState, useCallback, useEffect } from 'react';
import { InputEditor } from './InputEditor';
import { OutputPanel } from './OutputPanel';
import type { ValidationError, FormatType } from '../../types';

interface Props {
  input: string;
  output: string;
  format: FormatType;
  errors: ValidationError[];
  monacoTheme: string;
  onInputChange: (val: string) => void;
}

export function SplitView({ input, output, format, errors, monacoTheme, onInputChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => setIsDragging(true), []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPos(Math.min(85, Math.max(15, pct)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="split-view" ref={containerRef}>
      <div className="split-left" style={{ width: `${splitPos}%` }}>
        <InputEditor
          value={input}
          onChange={onInputChange}
          format={format}
          errors={errors}
          monacoTheme={monacoTheme}
        />
      </div>
      <div className="split-divider" onMouseDown={handleMouseDown} />
      <div className="split-right" style={{ width: `${100 - splitPos}%` }}>
        <OutputPanel
          value={output}
          format={format}
          monacoTheme={monacoTheme}
          inputText={input}
          inputErrors={errors}
        />
      </div>
    </div>
  );
}
