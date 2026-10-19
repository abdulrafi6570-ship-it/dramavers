'use client';

import { useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { formatDate } from '../../../lib/formatDate';
import PageHeader from '../../../components/admin/PageHeader';

const STATUS_LABEL = { new: 'Baru', read: 'Dibaca', done: 'Selesai' };
const STATUS_PILL = { new: 'a-pill-new', read: 'a-pill-read', done: 'a-pill-done' };

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState(null);

  function load() {
    fetch('/api/admin/feedback')
      .then((r) => r.json())
      .then((d) => setFeedback(d.feedback || []));
  }
  useEffect(load, []);

  async function setStatus(id, status) {
    setFeedback((fs) => fs.map((f) => (f.id === id ? { ...f, status } : f)));
    await fetch(`/api/admin/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  const baru = (feedback || []).filter((f) => f.status === 'new').length;

  return (
    <div>
      <PageHeader
        icon={MessageSquareText}
        title="Feedback User"
        subtitle={
          feedback
            ? baru > 0
              ? `${feedback.length} feedback · ${baru} baru`
              : `${feedback.length} feedback`
            : undefined
        }
      />

      {feedback === null && <p className="text-sm text-[#999991]">Memuat...</p>}

      {feedback?.length === 0 && (
        <div className="a-panel px-5 py-12 text-center">
          <p className="font-bold">Belum ada feedback</p>
          <p className="mt-1 text-sm text-[#777770]">
            Saran dan laporan dari user akan muncul di sini.
          </p>
        </div>
      )}

      <div className="grid items-start gap-3 xl:grid-cols-2">
        {feedback?.map((f) => (
          <div key={f.id} className="a-panel space-y-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black">
                {f.username ? `@${f.username}` : 'Tamu (belum login)'}
              </p>
              <span className={`a-pill shrink-0 ${STATUS_PILL[f.status] || 'a-pill-read'}`}>
                {STATUS_LABEL[f.status] || f.status}
              </span>
            </div>

            <p className="whitespace-pre-wrap break-words text-sm leading-6">{f.message}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efefea] pt-3">
              <p className="text-[11px] text-[#999991]">{formatDate(f.created_at)}</p>

              <div className="flex gap-1.5">
                {['new', 'read', 'done'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(f.id, s)}
                    className={`a-chip !py-1 !text-[11px] ${f.status === s ? 'a-chip-on' : ''}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}