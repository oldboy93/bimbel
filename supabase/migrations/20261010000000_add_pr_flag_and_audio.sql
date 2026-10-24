-- ══════════════════════════════════════════════════════════════
-- MIGRATION: ADD PR FLAG TO HAFALAN & MURAJAAH + AUDIO MATERIALS
-- Zero-downtime additive migration (safe for production)
-- ══════════════════════════════════════════════════════════════

-- 1. Tambah kolom PR flag pada hafalan_progress
ALTER TABLE hafalan_progress
  ADD COLUMN IF NOT EXISTS is_pr boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pr_notes_guru text,
  ADD COLUMN IF NOT EXISTS parent_rating int CHECK (parent_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS parent_status text CHECK (parent_status IN ('lancar', 'cukup', 'perlu_bimbingan')),
  ADD COLUMN IF NOT EXISTS parent_notes text,
  ADD COLUMN IF NOT EXISTS parent_simak_at timestamptz;

-- 2. Tambah kolom PR flag pada murajaah_sessions
ALTER TABLE murajaah_sessions
  ADD COLUMN IF NOT EXISTS is_pr boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pr_notes_guru text,
  ADD COLUMN IF NOT EXISTS parent_rating int CHECK (parent_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS parent_status text CHECK (parent_status IN ('lancar', 'cukup', 'perlu_bimbingan')),
  ADD COLUMN IF NOT EXISTS parent_notes text,
  ADD COLUMN IF NOT EXISTS parent_simak_at timestamptz;

-- 3. Tambah tipe 'audio' ke constraint tabel materials
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check;
ALTER TABLE materials ADD CONSTRAINT materials_type_check
  CHECK (type IN ('pdf', 'video', 'link', 'text', 'artikel', 'audio'));
