import { useState } from 'react';
import { NAV_CATEGORIES } from '../../types';

interface Props {
  activeFormat: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
}

export function Sidebar({ activeFormat, onSelect, collapsed }: Props) {
  const [collapsedCategories, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-inner">
        {NAV_CATEGORIES.map(cat => {
          const isCatCollapsed = collapsedCategories[cat.label];
          return (
            <div key={cat.label} className="sidebar-category">
              <button
                className="sidebar-category-header"
                onClick={() => toggleCategory(cat.label)}
              >
                <span className={`sidebar-arrow ${isCatCollapsed ? '' : 'expanded'}`}>&#9654;</span>
                <span className="sidebar-category-label">{cat.label}</span>
              </button>
              {!isCatCollapsed && (
                <div className="sidebar-items">
                  {cat.items.map(item => (
                    <button
                      key={`${item.value}-${item.section}`}
                      className={`sidebar-item ${activeFormat === item.value ? 'active' : ''}`}
                      onClick={() => onSelect(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
