-- ══════════════════════════════════════════════════════════════
-- GOLD STANDARD CONSOLIDATED RLS POLICIES (JWT-Powered)
-- Bersih total, tanpa recursion loop, performa super kilat.
-- ══════════════════════════════════════════════════════════════

-- 1. Hapus seluruh policy lama untuk memastikan bersih total
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. Terapkan RLS Clean & Baru ke semua tabel menggunakan JWT Claims

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses profil satu tenant" ON profiles
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Update profil sendiri" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- CLASSES
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses kelas satu tenant" ON classes
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Owner kelola kelas" ON classes
  FOR ALL TO authenticated USING (
    tenant_id = get_user_tenant_id() AND get_user_role() = 'owner'
  );

-- ENROLLMENTS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses enrollment satu tenant" ON enrollments
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Owner dan Guru kelola enrollment" ON enrollments
  FOR ALL TO authenticated USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'guru')
  );

-- SCHEDULES
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses jadwal satu tenant" ON schedules
  FOR SELECT TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );
CREATE POLICY "Owner dan Guru kelola jadwal" ON schedules
  FOR ALL TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('owner', 'guru')
  );

-- ATTENDANCES
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses absensi satu tenant" ON attendances
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Owner dan Guru kelola absensi" ON attendances
  FOR ALL TO authenticated USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'guru')
  );

-- HAFALAN PROGRESS
ALTER TABLE hafalan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses hafalan satu tenant" ON hafalan_progress
  FOR SELECT TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );
CREATE POLICY "Owner dan Guru kelola hafalan" ON hafalan_progress
  FOR ALL TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('owner', 'guru')
  );

-- TAJWID ASSESSMENTS
ALTER TABLE tajwid_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses tajwid satu tenant" ON tajwid_assessments
  FOR SELECT TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );
CREATE POLICY "Owner dan Guru kelola tajwid" ON tajwid_assessments
  FOR ALL TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('owner', 'guru')
  );

-- TEACHER NOTES
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses catatan satu tenant" ON teacher_notes
  FOR SELECT TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );
CREATE POLICY "Owner dan Guru kelola catatan" ON teacher_notes
  FOR ALL TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('owner', 'guru')
  );

-- MATERIALS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses materi satu tenant" ON materials
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Owner dan Guru kelola materi" ON materials
  FOR ALL TO authenticated USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'guru')
  );

-- REPORT CARDS
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses raport satu tenant" ON report_cards
  FOR SELECT TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
  );
CREATE POLICY "Owner dan Guru kelola raport" ON report_cards
  FOR ALL TO authenticated USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE tenant_id = get_user_tenant_id())
    AND get_user_role() IN ('owner', 'guru')
  );

-- TENANTS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Akses tenant sendiri" ON tenants
  FOR SELECT TO authenticated USING (id = get_user_tenant_id());
CREATE POLICY "Owner kelola tenant sendiri" ON tenants
  FOR UPDATE TO authenticated USING (id = get_user_tenant_id() AND get_user_role() = 'owner');
