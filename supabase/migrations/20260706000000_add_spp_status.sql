-- ══════════════════════════════════════════════════════════════
-- ADD SPP_STATUS TO ENROLLMENTS
-- ══════════════════════════════════════════════════════════════

-- 1. Tambahkan kolom spp_status untuk memisahkan status pembayaran bulanan SPP dengan status keaktifan kelas murid
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS spp_status text CHECK (spp_status IN ('paid', 'unpaid')) DEFAULT 'unpaid';

-- 2. Migrasi data lama agar tidak hilang:
-- Murid yang enrollment-nya 'active' diasumsikan sudah bayar (Lunas)
-- Murid yang enrollment-nya 'inactive' diasumsikan belum bayar (Belum Bayar)
UPDATE enrollments SET spp_status = 'paid' WHERE status = 'active';
UPDATE enrollments SET spp_status = 'unpaid' WHERE status = 'inactive';

-- 3. Kembalikan semua keaktifan murid di kelas menjadi 'active' agar muncul di halaman kelas guru & murid
UPDATE enrollments SET status = 'active';
