// Validasi link opsional: kosong -> null, hanya http/https yang diterima.
// Return { ok: true, url } atau { ok: false }
export function parseOptionalHttpUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return { ok: true, url: null };
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false };
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false };
  }
}