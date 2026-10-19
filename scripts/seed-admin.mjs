// Jalankan sekali: npm run seed:admin
// Membuat/mengupdate akun admin (usn & pw dari .env.local -> ADMIN_USERNAME/ADMIN_PASSWORD)
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = (process.env.ADMIN_USERNAME || 'rapp').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'rapp123';

if (!url || !key) {
  console.error('SUPABASE_URL / SERVICE_ROLE_KEY belum ada di .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const password_hash = await bcrypt.hash(password, 10);

const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('username', username)
  .maybeSingle();

if (existing) {
  await supabase
    .from('users')
    .update({ password_hash, role: 'admin' })
    .eq('id', existing.id);
  console.log(`Admin '${username}' sudah ada, password & role di-update.`);
} else {
  await supabase.from('users').insert({
    username,
    password_hash,
    display_name: username,
    role: 'admin',
    downloads_unlocked: true,
  });
  console.log(`Admin '${username}' berhasil dibuat.`);
}
