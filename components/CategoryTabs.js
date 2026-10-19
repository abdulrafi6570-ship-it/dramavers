'use client';

import { usePathname } from 'next/navigation';
import PillNav, { categoryIcon } from './ui/pill-nav';

export default function CategoryTabs({ categories = [] }) {
  const pathname = usePathname() || '';
  const match = pathname.match(/^\/category\/([^/?#]+)/);
  const activeKey = match ? decodeURIComponent(match[1]) : 'all';

  const items = [
    { key: 'all', href: '/category', label: 'Semua', Icon: categoryIcon('all') },
    ...categories.map((c) => ({
      key: c.slug,
      href: `/category/${c.slug}`,
      label: c.name,
      Icon: categoryIcon(c.slug),
    })),
  ];

  return (
    <PillNav
      items={items}
      activeKey={activeKey}
      layoutId="category-bubble"
      label="Kategori"
      wrapperClassName="-mx-4 px-4 pt-1 pb-2"
    />
  );
}