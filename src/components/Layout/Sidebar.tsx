import { useState } from 'react';
import { NAV_CATEGORIES } from '../../types';

interface Props {
  activeFormat: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const FORMAT_ICONS: Record<string, string> = {
  json: '{ }',
  xml: '</>',
  html: '<!>',
  sql: 'SQL',
  javascript: 'JS',
  css: '#CSS',
  markdown: 'MD',
  base64: 'B64',
  url: 'URL',
  yaml: 'YML',
  csv: 'CSV',
  properties: 'PRP',
  'xml-to-json': 'X>J',
  'json-to-xml': 'J>X',
  'csv-to-json': 'C>J',
  'json-to-csv': 'J>C',
  'yaml-to-json': 'Y>J',
  'json-to-yaml': 'J>Y',
  'properties-to-yaml': 'P>Y',
  'yaml-to-properties': 'Y>P',
  diff: '<>',
};

const DEFAULT_OPEN = new Set<string>();

export function Sidebar({ activeFormat, onSelect, collapsed, onToggle }: Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(DEFAULT_OPEN);

  const toggleSection = (label: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-header-title">All Tools</span>
          <button className="sidebar-close-btn" onClick={onToggle} title="Close sidebar">&#x2715;</button>
        </div>
        <div className="sidebar-inner">
          {NAV_CATEGORIES.map(cat => {
            const isOpen = openSections.has(cat.label);
            return (
              <div key={cat.label}>
                <button className="sidebar-section-label" onClick={() => toggleSection(cat.label)}>
                  <span className={`sidebar-section-arrow ${isOpen ? 'open' : ''}`}>&#x25B6;</span>
                  {cat.label}
                </button>
                {isOpen && (
                  <>
                    {cat.items.map(item => (
                      <button
                        key={`${item.value}-${item.section}`}
                        className={`sidebar-item ${activeFormat === item.value ? 'active' : ''}`}
                        onClick={() => onSelect(item.value)}
                      >
                        <span className="sidebar-item-icon">{FORMAT_ICONS[item.value] || '?'}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                    <div className="sidebar-divider" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </aside>
      <button className={`sidebar-reopen${collapsed ? ' visible' : ''}`} onClick={onToggle} title="Open sidebar">
        &#x2630;
      </button>
    </>
  );
}
