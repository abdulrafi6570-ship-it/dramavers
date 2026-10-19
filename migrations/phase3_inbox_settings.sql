-- Fase 3: Admin inbox (read tracking), site settings pakai tabel app_settings yang sudah ada.
-- Jalankan di Supabase SQL Editor SETELAH schema.sql + phase1 + phase2.

alter table messages add column if not exists read_at timestamptz;

create index if not exists messages_receiver_idx on messages(receiver_id, sender_id, read_at);
