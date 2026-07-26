-- ══════════════════════════════════════════════════════════════
-- MIGRATION: ADD IQRO & MURAJAAH TABLES
-- ══════════════════════════════════════════════════════════════

-- 1. Tabel Progress Iqro & Aisar
CREATE TABLE IF NOT EXISTS iqro_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('iqro', 'aisar')) NOT NULL DEFAULT 'iqro',
  jilid int NOT NULL DEFAULT 1,
  halaman int NOT NULL DEFAULT 1,
  total_halaman int NOT NULL DEFAULT 30,
  level text CHECK (level IN ('kurang', 'cukup', 'lancar', 'mahir')) DEFAULT 'lancar',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 2. Tabel Sesi Murajaah
CREATE TABLE IF NOT EXISTS murajaah_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  hafalan_ref_id uuid REFERENCES hafalan_progress(id) ON DELETE SET NULL,
  hafalan_type text CHECK (hafalan_type IN ('surat', 'juz')) NOT NULL DEFAULT 'surat',
  surah_number int,
  surah_name text NOT NULL,
  ayat_or_page_range text,
  quality text CHECK (quality IN ('lancar', 'perlu_perbaikan', 'mengulang')) NOT NULL DEFAULT 'lancar',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS POLICIES FOR IQRO_PROGRESS
ALTER TABLE iqro_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses iqro satu tenant" ON iqro_progress;
CREATE POLICY "Akses iqro satu tenant" ON iqro_progress
  FOR SELECT TO authenticated USING (
    tenant_id = get_user_tenant_id() OR enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );

DROP POLICY IF EXISTS "Owner dan Guru kelola iqro" ON iqro_progress;
CREATE POLICY "Owner dan Guru kelola iqro" ON iqro_progress
  FOR ALL TO authenticated USING (
    (tenant_id = get_user_tenant_id() OR enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id()))
    AND get_user_role() IN ('owner', 'guru')
  );

-- 4. RLS POLICIES FOR MURAJAAH_SESSIONS
ALTER TABLE murajaah_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses murajaah satu tenant" ON murajaah_sessions;
CREATE POLICY "Akses murajaah satu tenant" ON murajaah_sessions
  FOR SELECT TO authenticated USING (
    tenant_id = get_user_tenant_id() OR enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );

DROP POLICY IF EXISTS "Owner dan Guru kelola murajaah" ON murajaah_sessions;
CREATE POLICY "Owner dan Guru kelola murajaah" ON murajaah_sessions
  FOR ALL TO authenticated USING (
    (tenant_id = get_user_tenant_id() OR enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id()))
    AND get_user_role() IN ('owner', 'guru')
  );
