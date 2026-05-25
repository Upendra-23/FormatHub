import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function CustomSelect<T extends string>({ value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(o => !o);
  };

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`custom-select${open ? ' open' : ''}`}>
      <button className="custom-select-trigger" onClick={handleOpen}>
        <span>{selected?.label ?? value}</span>
        <span className="custom-select-arrow" />
      </button>
      {open && createPortal(
        <div ref={dropdownRef} className="custom-select-dropdown" style={{ top: pos.top, left: pos.left, minWidth: pos.width, position: 'fixed' }}>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
