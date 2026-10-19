'use client';

import { useEffect, useState } from 'react';
import { Tags, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import PageHeader from '../../../components/admin/PageHeader';
import Notice from '../../../components/admin/Notice';

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [subInputs, setSubInputs] = useState({});
  const [editing, setEditing] = useState(null); // { type: 'cat' | 'sub', id, value }
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
  }
  useEffect(() => { load(); }, []);

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    setMsg('');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCat.trim(), slug: slugify(newCat) }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setNewCat('');
    setMsg(`Kategori "${data.category.name}" ditambahkan ✓`);
    load();
  }

  async function addSub(categoryId) {
    const name = subInputs[categoryId];
    if (!name?.trim()) return;
    setMsg('');
    const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug: slugify(name) }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setSubInputs((s) => ({ ...s, [categoryId]: '' }));
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    setMsg('');
    const url = editing.type === 'cat' ? `/api/categories/${editing.id}` : `/api/subcategories/${editing.id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editing.value }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setEditing(null);
    setMsg('Perubahan disimpan ✓');
    load();
  }

  async function removeCategory(c) {
    if (!confirm(`Hapus kategori "${c.name}"?\n\nSub-kategorinya ikut terhapus. Drama di dalamnya TIDAK terhapus, tapi jadi "Tanpa kategori".`)) return;
    setMsg('');
    const res = await fetch(`/api/categories/${c.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg(`Kategori "${c.name}" dihapus ✓`);
    load();
  }

  async function removeSub(s) {
    if (!confirm(`Hapus sub-kategori "${s.name}"?`)) return;
    setMsg('');
    const res = await fetch(`/api/subcategories/${s.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    load();
  }

  // Input edit kecil (dipakai untuk kategori & sub-kategori)
  function renderEditRow(className = '', key) {
    return (
      <form
        key={key}
        onSubmit={(e) => { e.preventDefault(); saveEdit(); }}
        className={`flex items-center gap-1.5 ${className}`}
      >
        <input
          autoFocus
          className="input min-w-0 !py-1.5 text-sm"
          value={editing.value}
          onChange={(e) => setEditing((x) => ({ ...x, value: e.target.value }))}
        />
        <button className="a-btn a-btn-amber a-btn-sm shrink-0 !px-2.5" aria-label="Simpan">
          <Check size={15} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="a-btn a-btn-line a-btn-sm shrink-0 !px-2.5"
          aria-label="Batal"
        >
          <X size={15} />
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Tags}
        title="Kelola Kategori"
        subtitle={`${categories.length} kategori`}
      />

      {/* Tambah kategori */}
      <form
        onSubmit={addCategory}
        className="a-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5 lg:max-w-2xl"
      >
        <div className="flex-1">
          <label className="a-label">Kategori baru</label>
          <input
            className="input"
            placeholder="mis. VARIETY"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
        </div>

        <button className="a-btn a-btn-amber">
          <Plus size={16} /> Tambah
        </button>
      </form>

      <Notice msg={msg} />

      {/* Daftar kategori */}
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const editingThis = editing?.type === 'cat' && editing.id === c.id;

          return (
            <div key={c.id} className="a-panel space-y-4 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                {editingThis ? (
                  renderEditRow('flex-1')
                ) : (
                  <>
                    <p className="min-w-0 flex-1 truncate text-base font-black">{c.name}</p>
                    <span className="a-pill a-pill-read shrink-0">
                      {c.subcategories?.length || 0} sub
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing({ type: 'cat', id: c.id, value: c.name })}
                      className="a-btn a-btn-line a-btn-sm shrink-0 !px-2.5"
                      aria-label="Ubah nama kategori"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(c)}
                      className="a-btn a-btn-danger a-btn-sm shrink-0 !px-2.5"
                      aria-label="Hapus kategori"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {c.subcategories?.map((s) => {
                  const editingSub = editing?.type === 'sub' && editing.id === s.id;

                  if (editingSub) {
                    return renderEditRow('w-full', s.id);
                  }

                  return (
                    <span key={s.id} className="a-chip gap-1.5">
                      {s.name}
                      <button
                        type="button"
                        onClick={() => setEditing({ type: 'sub', id: s.id, value: s.name })}
                        className="text-[#999991] hover:text-[#171717]"
                        aria-label={`Ubah ${s.name}`}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSub(s)}
                        className="text-[#999991] hover:text-red-600"
                        aria-label={`Hapus ${s.name}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  );
                })}

                {!c.subcategories?.length && (
                  <span className="text-xs text-[#999991]">Belum ada sub-kategori</span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSub(c.id);
                }}
                className="flex gap-2"
              >
                <input
                  className="input min-w-0"
                  placeholder="Tambah sub (mis. KDrama)"
                  value={subInputs[c.id] || ''}
                  onChange={(e) =>
                    setSubInputs((s) => ({ ...s, [c.id]: e.target.value }))
                  }
                />

                <button className="a-btn a-btn-line shrink-0">
                  <Plus size={15} /> Sub
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-[#999991]">Belum ada kategori.</p>
      )}
    </div>
  );
}