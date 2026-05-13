-- ══════════════════════════════════════════════════════════════
-- SEED DATA DUMMY — Bimbel Calistung & Tahfidz
-- 1 Tenant · 3 Guru · 5 Murid · 3 Kelas · Enrollment + Data Contoh
-- Password semua akun: Bimbel123!
-- ══════════════════════════════════════════════════════════════

-- Enable pgcrypto untuk encrypt password (sudah aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── FIXED UUIDs ──────────────────────────────────────────────
DO $$
DECLARE
  -- TENANT
  v_tenant   uuid := 'aaaaaaaa-0000-0000-0000-000000000001';

  -- GURU
  v_guru1    uuid := 'bbbbbbbb-0001-0000-0000-000000000001';
  v_guru2    uuid := 'bbbbbbbb-0002-0000-0000-000000000001';
  v_guru3    uuid := 'bbbbbbbb-0003-0000-0000-000000000001';

  -- MURID
  v_murid1   uuid := 'cccccccc-0001-0000-0000-000000000001';
  v_murid2   uuid := 'cccccccc-0002-0000-0000-000000000001';
  v_murid3   uuid := 'cccccccc-0003-0000-0000-000000000001';
  v_murid4   uuid := 'cccccccc-0004-0000-0000-000000000001';
  v_murid5   uuid := 'cccccccc-0005-0000-0000-000000000001';

  -- KELAS
  v_kelas1   uuid := 'dddddddd-0001-0000-0000-000000000001';  -- Tahfidz Pagi
  v_kelas2   uuid := 'dddddddd-0002-0000-0000-000000000001';  -- Tahfidz Sore
  v_kelas3   uuid := 'dddddddd-0003-0000-0000-000000000001';  -- Calistung A

  -- ENROLLMENT
  v_enr1     uuid := 'eeeeeeee-0001-0000-0000-000000000001';
  v_enr2     uuid := 'eeeeeeee-0002-0000-0000-000000000001';
  v_enr3     uuid := 'eeeeeeee-0003-0000-0000-000000000001';
  v_enr4     uuid := 'eeeeeeee-0004-0000-0000-000000000001';
  v_enr5     uuid := 'eeeeeeee-0005-0000-0000-000000000001';

  v_pwd      text;
BEGIN
  -- Hash password "Bimbel123!"
  v_pwd := crypt('Bimbel123!', gen_salt('bf'));

  -- ════════════════════════════════════════
  -- 1. TENANT
  -- ════════════════════════════════════════
  INSERT INTO tenants (id, name, slug, address, phone, subscription_plan, is_active)
  VALUES (
    v_tenant,
    'Bimbel Al-Hikmah',
    'al-hikmah',
    'Jl. Melati No. 12, Bandung',
    '022-1234567',
    'basic',
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════
  -- 2. AUTH USERS (langsung ke tabel auth)
  -- ════════════════════════════════════════

  -- Guru 1
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_guru1, '00000000-0000-0000-0000-000000000000',
    'ustadz.ahmad@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"guru","full_name":"Ustadz Ahmad Fauzi"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Guru 2
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_guru2, '00000000-0000-0000-0000-000000000000',
    'ustadzah.siti@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"guru","full_name":"Ustadzah Siti Rahmawati"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Guru 3
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_guru3, '00000000-0000-0000-0000-000000000000',
    'ustadz.ridwan@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"guru","full_name":"Ustadz Ridwan Hakim"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Murid 1
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_murid1, '00000000-0000-0000-0000-000000000000',
    'murid.ali@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"murid","full_name":"Muhammad Ali Akbar"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Murid 2
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_murid2, '00000000-0000-0000-0000-000000000000',
    'murid.fatimah@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"murid","full_name":"Fatimah Azzahra"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Murid 3
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_murid3, '00000000-0000-0000-0000-000000000000',
    'murid.ibrahim@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"murid","full_name":"Ibrahim Musa"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Murid 4
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_murid4, '00000000-0000-0000-0000-000000000000',
    'murid.khadijah@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"murid","full_name":"Khadijah Nur Aisyah"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Murid 5
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
    aud, role, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (v_murid5, '00000000-0000-0000-0000-000000000000',
    'murid.umar@bimbel.com', v_pwd, now(),
    'authenticated', 'authenticated',
    '{"role":"murid","full_name":"Umar bin Khattab Jr"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════
  -- 3. PROFILES
  -- ════════════════════════════════════════
  INSERT INTO profiles (id, tenant_id, full_name, role, phone, address, is_active) VALUES
    (v_guru1, v_tenant, 'Ustadz Ahmad Fauzi',     'guru',  '081234567001', 'Jl. Anggrek No. 5, Bandung',    true),
    (v_guru2, v_tenant, 'Ustadzah Siti Rahmawati', 'guru',  '081234567002', 'Jl. Mawar No. 8, Bandung',      true),
    (v_guru3, v_tenant, 'Ustadz Ridwan Hakim',     'guru',  '081234567003', 'Jl. Melati No. 3, Bandung',     true),
    (v_murid1, v_tenant, 'Muhammad Ali Akbar',     'murid', '081298765001', 'Jl. Cempaka No. 10, Bandung',   true),
    (v_murid2, v_tenant, 'Fatimah Azzahra',        'murid', '081298765002', 'Jl. Dahlia No. 22, Bandung',    true),
    (v_murid3, v_tenant, 'Ibrahim Musa',            'murid', '081298765003', 'Jl. Kenanga No. 7, Bandung',    true),
    (v_murid4, v_tenant, 'Khadijah Nur Aisyah',    'murid', '081298765004', 'Jl. Seroja No. 15, Bandung',    true),
    (v_murid5, v_tenant, 'Umar bin Khattab Jr',    'murid', '081298765005', 'Jl. Flamboyan No. 4, Bandung',  true)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════
  -- 4. KELAS
  -- ════════════════════════════════════════
  INSERT INTO classes (id, tenant_id, name, type, description, price, is_active) VALUES
    (v_kelas1, v_tenant, 'Tahfidz Pagi — Kelas A', 'tahfidz', 'Kelas pagi hafalan Al-Quran, target Juz 30 dalam 6 bulan.', 150000, true),
    (v_kelas2, v_tenant, 'Tahfidz Sore — Kelas B', 'tahfidz', 'Kelas sore hafalan Al-Quran untuk pemula.', 150000, true),
    (v_kelas3, v_tenant, 'Calistung Kelas A',       'calistung','Belajar membaca, menulis, dan berhitung dasar.', 100000, true)
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════
  -- 5. ENROLLMENTS (Murid → Kelas)
  -- ════════════════════════════════════════
  -- Ali → Tahfidz Pagi
  INSERT INTO enrollments (id, tenant_id, student_id, class_id, parent_pin, status) VALUES
    (v_enr1, v_tenant, v_murid1, v_kelas1, '123456', 'active'),
    (v_enr2, v_tenant, v_murid2, v_kelas1, '234567', 'active'),
    (v_enr3, v_tenant, v_murid3, v_kelas2, '345678', 'active'),
    (v_enr4, v_tenant, v_murid4, v_kelas2, '456789', 'active'),
    (v_enr5, v_tenant, v_murid5, v_kelas3, '567890', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════
  -- 6. JADWAL BELAJAR
  -- ════════════════════════════════════════
  -- Ali: Senin (1) + Rabu (3) + Jumat (5)
  INSERT INTO schedules (enrollment_id, day_of_week, activity, material_notes, time_start, time_end) VALUES
    (v_enr1, 1, 'Hafalan Baru',     'Surat An-Nas dan Al-Falaq', '07:00', '08:00'),
    (v_enr1, 3, 'Murajaah',         'Juz 30 — 5 surat terakhir', '07:00', '08:00'),
    (v_enr1, 5, 'Tajwid + Hafalan', 'Hukum Mad dan Ghunnah',     '07:00', '08:00'),
    -- Fatimah: Senin + Rabu
    (v_enr2, 1, 'Hafalan Baru',     'Surat Al-Ikhlas dan Al-Lahab', '08:00', '09:00'),
    (v_enr2, 3, 'Murajaah',         'Surat-surat pendek Juz 30',    '08:00', '09:00'),
    -- Ibrahim: Selasa (2) + Kamis (4)
    (v_enr3, 2, 'Hafalan Baru',     'Dimulai dari Surat An-Nas',    '15:00', '16:00'),
    (v_enr3, 4, 'Murajaah',         'Surat-surat yang sudah dihafal','15:00', '16:00'),
    -- Khadijah: Selasa + Kamis
    (v_enr4, 2, 'Hafalan Baru',     'Surat Al-Kafirun',             '16:00', '17:00'),
    (v_enr4, 4, 'Tajwid',           'Makhorijul Huruf dasar',       '16:00', '17:00'),
    -- Umar: Senin + Rabu + Sabtu (6) — Calistung
    (v_enr5, 1, 'Belajar Membaca',  'Iqro jilid 2 halaman 10-15',  '09:00', '10:00'),
    (v_enr5, 3, 'Belajar Menulis',  'Latihan menulis huruf A-Z',   '09:00', '10:00'),
    (v_enr5, 6, 'Berhitung',        'Penjumlahan 1-20',             '09:00', '10:00')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════
  -- 7. ABSENSI (10 hari terakhir per murid)
  -- ════════════════════════════════════════
  -- Ali — rajin hadir
  INSERT INTO attendances (enrollment_id, guru_id, tenant_id, date, status, notes) VALUES
    (v_enr1, v_guru1, v_tenant, CURRENT_DATE - 9, 'H', ''),
    (v_enr1, v_guru1, v_tenant, CURRENT_DATE - 7, 'H', ''),
    (v_enr1, v_guru1, v_tenant, CURRENT_DATE - 5, 'H', ''),
    (v_enr1, v_guru1, v_tenant, CURRENT_DATE - 3, 'I', 'Sakit demam'),
    (v_enr1, v_guru1, v_tenant, CURRENT_DATE - 1, 'H', ''),
    -- Fatimah — sangat rajin
    (v_enr2, v_guru1, v_tenant, CURRENT_DATE - 9, 'H', ''),
    (v_enr2, v_guru1, v_tenant, CURRENT_DATE - 7, 'H', ''),
    (v_enr2, v_guru1, v_tenant, CURRENT_DATE - 5, 'H', ''),
    (v_enr2, v_guru1, v_tenant, CURRENT_DATE - 3, 'H', ''),
    (v_enr2, v_guru1, v_tenant, CURRENT_DATE - 1, 'H', ''),
    -- Ibrahim — beberapa alpha
    (v_enr3, v_guru2, v_tenant, CURRENT_DATE - 8, 'H', ''),
    (v_enr3, v_guru2, v_tenant, CURRENT_DATE - 6, 'A', 'Tidak ada kabar'),
    (v_enr3, v_guru2, v_tenant, CURRENT_DATE - 4, 'H', ''),
    (v_enr3, v_guru2, v_tenant, CURRENT_DATE - 2, 'I', 'Ada acara keluarga'),
    -- Khadijah
    (v_enr4, v_guru2, v_tenant, CURRENT_DATE - 8, 'H', ''),
    (v_enr4, v_guru2, v_tenant, CURRENT_DATE - 6, 'H', ''),
    (v_enr4, v_guru2, v_tenant, CURRENT_DATE - 4, 'H', ''),
    (v_enr4, v_guru2, v_tenant, CURRENT_DATE - 2, 'I', 'Izin ada keperluan'),
    -- Umar
    (v_enr5, v_guru3, v_tenant, CURRENT_DATE - 7, 'H', ''),
    (v_enr5, v_guru3, v_tenant, CURRENT_DATE - 5, 'H', ''),
    (v_enr5, v_guru3, v_tenant, CURRENT_DATE - 3, 'A', 'Tidak hadir tanpa keterangan'),
    (v_enr5, v_guru3, v_tenant, CURRENT_DATE - 1, 'H', '')
  ON CONFLICT ON CONSTRAINT attendances_enrollment_date_unique DO NOTHING;

  -- ════════════════════════════════════════
  -- 8. HAFALAN PROGRESS
  -- ════════════════════════════════════════
  INSERT INTO hafalan_progress (enrollment_id, guru_id, surah_number, surah_name, total_ayat, ayat_reached, session_date, notes) VALUES
    -- Ali: sudah maju ke An-Nas, Al-Falaq, Al-Ikhlas
    (v_enr1, v_guru1, 114, 'An-Nas',   6, 6, CURRENT_DATE - 10, 'Sudah lancar, lanjut ke Al-Falaq'),
    (v_enr1, v_guru1, 113, 'Al-Falaq', 5, 5, CURRENT_DATE - 7,  'Hafal sempurna dalam 2 sesi'),
    (v_enr1, v_guru1, 112, 'Al-Ikhlas',4, 3, CURRENT_DATE - 3,  'Masih perlu 1 ayat lagi, makhraj qul sudah bagus'),
    -- Fatimah: progress sangat bagus
    (v_enr2, v_guru1, 114, 'An-Nas',   6, 6, CURRENT_DATE - 12, 'Hafal sempurna sejak awal masuk'),
    (v_enr2, v_guru1, 113, 'Al-Falaq', 5, 5, CURRENT_DATE - 9,  'Cepat sekali menghafalnya'),
    (v_enr2, v_guru1, 112, 'Al-Ikhlas',4, 4, CURRENT_DATE - 6,  'Sudah selesai, lanjut Al-Lahab'),
    (v_enr2, v_guru1, 111, 'Al-Lahab', 5, 2, CURRENT_DATE - 2,  'Masih dalam proses hafalan'),
    -- Ibrahim: baru mulai
    (v_enr3, v_guru2, 114, 'An-Nas',   6, 4, CURRENT_DATE - 8,  'Masih kesulitan di bagian akhir'),
    (v_enr3, v_guru2, 114, 'An-Nas',   6, 6, CURRENT_DATE - 4,  'Alhamdulillah sudah lancar semua'),
    -- Khadijah: sedang di An-Nas
    (v_enr4, v_guru2, 114, 'An-Nas',   6, 3, CURRENT_DATE - 6,  'Perlu latihan makhraj huruf sin'),
    (v_enr4, v_guru2, 114, 'An-Nas',   6, 5, CURRENT_DATE - 2,  'Sudah hampir selesai, tinggal 1 ayat')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════
  -- 9. TAJWID ASSESSMENTS
  -- ════════════════════════════════════════
  INSERT INTO tajwid_assessments (enrollment_id, guru_id, session_date, makhraj_level, makhraj_notes, kelancaran_level, kelancaran_notes, tajwid_level, tajwid_notes) VALUES
    (v_enr1, v_guru1, CURRENT_DATE - 7, 'sedang', 'Huruf qaf dan ain perlu dilatih', 'lancar', 'Sudah cukup lancar', 'sedang', 'Mad thabi''i sudah tahu, perlu latihan mad wajib'),
    (v_enr2, v_guru1, CURRENT_DATE - 7, 'lancar', 'Makhroj sangat bagus', 'lancar', 'Kelancaran terbaik di kelas', 'lancar', 'Semua hukum tajwid sudah dikuasai dengan baik'),
    (v_enr3, v_guru2, CURRENT_DATE - 4, 'mulai',  'Masih kesulitan huruf-huruf tenggorokan', 'mulai', 'Perlu banyak latihan membaca', 'mulai', 'Belum mengenal hukum tajwid dasar'),
    (v_enr4, v_guru2, CURRENT_DATE - 2, 'sedang', 'Huruf sin dan syin sudah membaik', 'sedang', 'Kecepatan membaca perlu ditingkatkan', 'mulai', 'Baru belajar hukum nun mati')
  ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════
  -- 10. CATATAN GURU
  -- ════════════════════════════════════════
  INSERT INTO teacher_notes (enrollment_id, guru_id, note_date, content, is_visible_to_wali) VALUES
    (v_enr1, v_guru1, CURRENT_DATE - 5, 'Ali menunjukkan perkembangan yang sangat baik. Hafalan An-Nas dan Al-Falaq sudah sangat lancar. Perlu ditingkatkan latihan di rumah untuk Al-Ikhlas.', true),
    (v_enr1, v_guru1, CURRENT_DATE - 1, 'Hari ini Ali tidak masuk karena sakit. Mohon wali murid membantu murajaah di rumah selama masa pemulihan.', true),
    (v_enr2, v_guru1, CURRENT_DATE - 6, 'Fatimah adalah murid yang luar biasa! Kemampuan hafalannya jauh di atas teman-temannya. Disarankan untuk mengikuti program akselerasi.', true),
    (v_enr2, v_guru1, CURRENT_DATE - 2, 'Catatan internal: Fatimah berpotensi menjadi duta bimbel. Koordinasikan dengan owner untuk program beasiswa.', false),
    (v_enr3, v_guru2, CURRENT_DATE - 4, 'Ibrahim masih perlu banyak bimbingan. Makhraj huruf tenggorokan masih belum tepat. Mohon orang tua sabar dan terus mendukung.', true),
    (v_enr4, v_guru2, CURRENT_DATE - 2, 'Khadijah mengalami kemajuan yang baik minggu ini. Huruf sin dan syin sudah membaik. Pertahankan semangat belajarnya!', true),
    (v_enr5, v_guru3, CURRENT_DATE - 3, 'Umar tidak hadir tanpa keterangan. Mohon orang tua konfirmasi jika ada halangan agar dapat kami jadwalkan ulang.', true)
  ON CONFLICT DO NOTHING;

END $$;

-- ════════════════════════════════════════
-- UPDATE: Set NEXT_PUBLIC_TENANT_ID
-- ════════════════════════════════════════
-- Setelah menjalankan migration ini, update .env.local:
-- NEXT_PUBLIC_TENANT_ID=aaaaaaaa-0000-0000-0000-000000000001
-- 
-- Akun untuk login (semua password: Bimbel123!):
-- Owner  : (gunakan akun yang sudah dibuat sebelumnya di Supabase)
-- Guru 1 : ustadz.ahmad@bimbel.com
-- Guru 2 : ustadzah.siti@bimbel.com
-- Guru 3 : ustadz.ridwan@bimbel.com
-- Murid 1: murid.ali@bimbel.com
-- Murid 2: murid.fatimah@bimbel.com
-- Murid 3: murid.ibrahim@bimbel.com
-- Murid 4: murid.khadijah@bimbel.com
-- Murid 5: murid.umar@bimbel.com
