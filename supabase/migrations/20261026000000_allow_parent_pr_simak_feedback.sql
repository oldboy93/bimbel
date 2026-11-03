-- ══════════════════════════════════════════════════════════════
-- MIGRATION: ALLOW PARENT/STUDENT FEEDBACK UPDATE ON PR SESSIONS
-- ══════════════════════════════════════════════════════════════

-- 1. Izin update feedback simakan ortu pada hafalan_progress
DROP POLICY IF EXISTS "Murid simpan feedback simakan hafalan" ON hafalan_progress;
CREATE POLICY "Murid simpan feedback simakan hafalan" ON hafalan_progress
  FOR UPDATE TO authenticated
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments 
      WHERE student_id = auth.uid() OR tenant_id = get_user_tenant_id()
    )
  )
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM enrollments 
      WHERE student_id = auth.uid() OR tenant_id = get_user_tenant_id()
    )
  );

-- 2. Izin update feedback simakan ortu pada murajaah_sessions
DROP POLICY IF EXISTS "Murid simpan feedback simakan murajaah" ON murajaah_sessions;
CREATE POLICY "Murid simpan feedback simakan murajaah" ON murajaah_sessions
  FOR UPDATE TO authenticated
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments 
      WHERE student_id = auth.uid() OR tenant_id = get_user_tenant_id()
    )
  )
  WITH CHECK (
    enrollment_id IN (
      SELECT id FROM enrollments 
      WHERE student_id = auth.uid() OR tenant_id = get_user_tenant_id()
    )
  );
