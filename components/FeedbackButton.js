'use client';
import { useState } from 'react';
import { MessageSquarePlus, X, Send, Check } from 'lucide-react';
import Button from './ui/button';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    setSending(false);
    if (res.ok) {
      setSent(true);
      setMessage('');
      setTimeout(() => {
        setSent(false);
        setOpen(false);
      }, 1200);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-30 h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg text-muted-foreground hover:text-primary transition"
        title="Kirim feedback"
      >
        <MessageSquarePlus size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 space-y-3 animate-slide-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Kasih Masukan</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {sent ? (
              <p className="text-sm text-emerald-400 flex items-center gap-2 py-3"><Check size={16} /> Makasih, feedback kamu terkirim!</p>
            ) : (
              <form onSubmit={submit} className="space-y-2.5">
                <textarea
                  className="input min-h-24 resize-none"
                  placeholder="Ada bug? Ide fitur? Kasih tau kami..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" disabled={sending} className="w-full"><Send size={15} /> {sending ? 'Mengirim...' : 'Kirim'}</Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
