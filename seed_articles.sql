-- ══════════════════════════════════════════════════════════════
-- MIGRATION & SEED: premium articles dummy data
-- ══════════════════════════════════════════════════════════════

-- 1. Hapus constraint lama agar kita bisa memperbaruinya
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_type_check;

-- 2. Buat constraint baru yang mendukung tipe 'artikel'
ALTER TABLE materials ADD CONSTRAINT materials_type_check 
  CHECK (type IN ('pdf', 'video', 'link', 'text', 'artikel'));

-- 3. Tambahkan kolom metadata JSONB untuk menyimpan link youtube dan data artikel lainnya
ALTER TABLE materials ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 4. Masukkan data dummy artikel premium yang menakjubkan
INSERT INTO materials (id, tenant_id, guru_id, class_id, title, description, file_url, type, is_published, metadata)
VALUES 
(
  'eeeeeeee-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0001-0000-0000-000000000001', -- Ustadz Ahmad Fauzi
  'dddddddd-0001-0000-0000-000000000001', -- Tahfidz Pagi
  'Metode Kauny: Menghafal Al-Qur''an Semudah Tersenyum',
  '# Menghafal Al-Qur''an dengan Metode Kauny

Metode Kauny adalah salah satu inovasi dalam menghafal Al-Qur''an secara visual dan kinestetik dengan gerakan tangan kreatif. Metode ini mempermudah santri mengingat arti dan posisi ayat dengan cara yang menyenangkan.

## Mengapa Memilih Metode Kauny?
* **Mudah Dipahami**: Tidak memerlukan hafalan teks rumit sejak awal.
* **Aktivasi Otak Kanan**: Menggunakan ilustrasi visual dan gerakan tangan motorik.
* **Menyenangkan**: Sangat disukai oleh anak-anak usia dini maupun dewasa.

> "Sebaik-baik kalian adalah yang mempelajari Al-Qur''an dan mengajarkannya." (HR. Bukhari)

### Langkah Praktis Memulai:
1. Dengarkan pelafalan ayat suci oleh Ustadz/Ustadzah dengan saksama.
2. Ikuti gerakan isyarat tangan yang melambangkan arti kata per kata.
3. Ulangi gerakan tersebut sebanyak 3-5 kali hingga motorik tangan sinkron dengan lisan.',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
  'artikel',
  true,
  '{"youtube_url": "https://www.youtube.com/watch?v=krc_HqA47d4"}'::jsonb
),
(
  'eeeeeeee-0002-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0001-0000-0000-000000000001', -- Ustadz Ahmad Fauzi
  'dddddddd-0001-0000-0000-000000000001', -- Tahfidz Pagi
  'Kunci Sukses Tajwid: Memahami 5 Letak Keluarnya Huruf (Makhorijul Huruf)',
  '# Belajar Makhorijul Huruf dengan Mudah

Membaca Al-Qur''an dengan tajwid yang benar adalah kewajiban bagi setiap muslim. Salah satu pilar utama tajwid adalah memahami letak keluarnya huruf hijaiyah.

## 5 Makhorijul Huruf Utama:
1. **Al-Jauf (Rongga Mulut)**: Untuk huruf-huruf mad (panjang) seperti Alif, Wawu, Ya.
2. **Al-Halq (Tenggorokan)**: Tempat keluarnya huruf Hamzah, Ha, ''Ain, Hha, Ghoin, Kho.
3. **Al-Lisan (Lidah)**: Bagian paling aktif, menghasilkan mayoritas huruf hijaiyah.
4. **Asy-Syafatain (Dua Bibir)**: Tempat keluarnya huruf Fa, Wawu, Ba, Mim.
5. **Al-Khaisyum (Rongga Hidung)**: Tempat keluarnya suara dengung (ghunnah).

> Membaca Al-Qur''an dengan tartil akan mendatangkan ketenangan hati dan pahala yang berlipat ganda.

### Tips Latihan:
* Gunakan cermin kecil saat melatih pengucapan huruf tenggorokan.
* Dengarkan audio rekaman dari Qari legendaris untuk menyamakan nada dan makhraj.',
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=1000&auto=format&fit=crop',
  'artikel',
  true,
  '{"youtube_url": "https://www.youtube.com/watch?v=Jd3Yp0c_pB4"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_url = EXCLUDED.file_url,
  type = EXCLUDED.type,
  is_published = EXCLUDED.is_published,
  metadata = EXCLUDED.metadata;
