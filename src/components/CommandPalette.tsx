import { useState, useEffect, useRef } from 'react';

interface CmdItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CmdItem[];
}

export function CommandPalette({ isOpen, onClose, items }: Props) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setQuery('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '520px', maxWidth: '90vw',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'slideDown 0.2s ease',
        }}
      >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '16px' }}>&#8981;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search commands..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              No results found
            </div>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { item.action(); onClose(); }}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '8px 12px',
                border: 'none', borderRadius: 'var(--radius-sm)',
                background: i === selectedIndex ? 'var(--bg-tertiary)' : 'transparent',
                color: 'var(--text-primary)',
                fontSize: '13px', textAlign: 'left', cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: '14px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
