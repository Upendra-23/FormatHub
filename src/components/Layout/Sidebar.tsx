import { NAV_CATEGORIES } from '../../types';

interface Props {
  activeFormat: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
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
};

export function Sidebar({ activeFormat, onSelect, collapsed }: Props) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-inner">
        {NAV_CATEGORIES.map(cat => (
          <div key={cat.label}>
            <div className="sidebar-section-label">{cat.label}</div>
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
          </div>
        ))}
      </div>
    </aside>
  );
}
