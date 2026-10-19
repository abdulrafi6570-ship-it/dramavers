'use client';

import { useState } from 'react';

// Teks panjang yang rapi dibaca: baris baru dipertahankan,
// dipotong 4 baris dengan tombol "Baca selengkapnya".
export default function ExpandableText({ text, maxChars = 220, className = '' }) {
  const [open, setOpen] = useState(false);

  const clean = (text || '').trim();
  if (!clean) return null;

  const long = clean.length > maxChars || clean.split('\n').length > 4;

  return (
    <div>
      <p
        className={`whitespace-pre-line break-words ${
          !open && long ? 'line-clamp-4' : ''
        } ${className}`}
      >
        {clean}
      </p>

      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs font-bold text-primary hover:underline"
        >
          {open ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
        </button>
      )}
    </div>
  );
}