-- Migration: add_raport_data_column
-- Menambahkan kolom class_type dan data (JSONB) ke tabel report_cards
-- agar setiap template raport (calistung, tahfidz, dll) bisa menyimpan
-- struktur data yang berbeda tanpa merusak skema yang sudah ada.

ALTER TABLE report_cards
  ADD COLUMN IF NOT EXISTS class_type text DEFAULT 'umum',
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}';

-- Index untuk mempercepat query berdasarkan class_type
CREATE INDEX IF NOT EXISTS idx_report_cards_class_type
  ON report_cards(class_type);
