'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

// Pilih banyak aktor. Ada kolom cari kalau aktornya banyak.
export default function ActorPicker({
  actors = [],
  selected = [],
  onToggle,
  label = 'Tag aktor (opsional)',
}) {
  const [q, setQ] = useState('');

  const list = actors.filter((a) =>
    a.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#666660]">{label}</span>
        <span className="a-pill a-pill-read">{selected.length} dipilih</span>
      </div>

      {actors.length > 6 && (
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999991]"
          />
          <input
            className="input !pl-9"
            placeholder="Cari aktor..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
        {list.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => onToggle(a.id)}
            className={`a-chip ${selected.includes(a.id) ? 'a-chip-on' : ''}`}
          >
            {a.name}
          </button>
        ))}

        {actors.length === 0 && (
          <p className="text-xs text-[#999991]">Belum ada aktor terdaftar.</p>
        )}

        {actors.length > 0 && list.length === 0 && (
          <p className="text-xs text-[#999991]">Aktor tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
}
