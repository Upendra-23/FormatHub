import { NAV_CATEGORIES } from '../../types';

interface Props {
  format: string;
}

function findNavItem(toolId: string) {
  for (const cat of NAV_CATEGORIES) {
    const item = cat.items.find(i => i.value === toolId);
    if (item) return { category: cat.label, item };
  }
  return null;
}

export function Breadcrumb({ format }: Props) {
  const nav = findNavItem(format);
  if (!nav) return null;

  return (
    <div className="breadcrumb">
      <a href="#">{nav.category}</a>
      <span className="breadcrumb-sep">&rsaquo;</span>
      <span className="breadcrumb-current">{nav.item.label}</span>
    </div>
  );
}
