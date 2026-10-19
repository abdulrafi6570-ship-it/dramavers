import { supabaseAdmin } from './supabaseAdmin';

const DEFAULTS = {
  backsound_enabled: 'false',
  backsound_url: '',
  donation_qris_url: '',
  donation_dana: '',
  donation_gopay: '',
  donation_saweria_url: '',
};

export async function getSettings(keys = Object.keys(DEFAULTS)) {
  const db = supabaseAdmin();
  const { data, error } = await db.from('app_settings').select('key, value').in('key', keys);

  // Kalau gagal baca, tampilkan penyebabnya di terminal (tempat npm run dev jalan)
  if (error) console.error('[getSettings] gagal baca app_settings:', error.message);

  const map = { ...DEFAULTS };
  for (const row of data || []) map[row.key] = row.value ?? '';
  return map;
}

export async function setSettings(values) {
  const db = supabaseAdmin();
  const rows = Object.entries(values).map(([key, value]) => ({ key, value: value ?? '' }));
  const { error } = await db.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    console.error('[setSettings] gagal simpan app_settings:', error.message);
    throw error;
  }
}