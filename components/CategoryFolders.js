'use client';

import AnimatedFolder from './ui/animated-folder';

export default function CategoryFolders({ categories = [] }) {
  if (!categories || categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {categories.map((cat, idx) => (
        <AnimatedFolder
          key={cat.id || cat.slug || idx}
          index={idx}
          title={cat.name}
          projects={cat.projects || []}
          href={`/category/${cat.slug}`}
        />
      ))}
    </div>
  );
}