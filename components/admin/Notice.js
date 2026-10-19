// Pesan hasil aksi. tone: 'ok' | 'err' | 'info'
// Kalau tone kosong: pesan yang mengandung ✓ dianggap sukses, selain itu error.
export default function Notice({ msg, tone }) {
  if (!msg) return null;

  const t = tone || (msg.includes('✓') ? 'ok' : 'err');
  const cls = {
    ok: 'a-notice-ok',
    err: 'a-notice-err',
    info: 'a-notice-info',
  }[t];

  return <p className={`a-notice ${cls}`}>{msg}</p>;
}