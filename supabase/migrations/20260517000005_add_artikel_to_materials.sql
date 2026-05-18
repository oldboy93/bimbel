-- ══════════════════════════════════════════════════════════════
-- ADD ARTIKEL TYPE AND METADATA COLUMN TO MATERIALS
-- ══════════════════════════════════════════════════════════════

-- 1. Hapus constraint lama agar kita bisa memperbaruinya
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check;

-- 2. Buat constraint baru yang mendukung tipe 'artikel'
ALTER TABLE materials ADD CONSTRAINT materials_type_check 
  CHECK (type IN ('pdf', 'video', 'link', 'text', 'artikel'));

-- 3. Tambahkan kolom metadata JSONB untuk menyimpan link youtube dan data artikel lainnya
ALTER TABLE materials ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
