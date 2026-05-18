-- ══════════════════════════════════════════════════════════════
-- ADD SIGNATURE TO PROFILES TABLE
-- Menambahkan kolom signature untuk menyimpan Tanda Tangan Guru (Base64)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature text;
