/**
 * studentService.ts
 * Layer abstraksi query Supabase untuk modul Murid.
 * Bergaya Khanza: semua fungsi ada di satu file, mudah dicari & dimodifikasi.
 */
import { createClient } from '@/lib/supabase/client';
import type { Profile, Enrollment, EnrollmentWithDetails } from '@/types';

const getDb = () => createClient();

// ── LIST ALL STUDENTS ──────────────────────────────────────
export const tampilSemuaMurid = async (): Promise<Profile[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('role', 'murid')
    .eq('is_active', true)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── GET SINGLE STUDENT ─────────────────────────────────────
export const tampilMurid = async (studentId: string): Promise<Profile | null> => {
  const db = getDb();
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single();
  if (error) return null;
  return data;
};

// ── GET ENROLLMENTS FOR A STUDENT ─────────────────────────
export const tampilEnrollmentMurid = async (studentId: string): Promise<EnrollmentWithDetails[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('enrollments')
    .select(`
      *,
      profiles!enrollments_student_id_fkey(*),
      classes(*),
      schedules(*)
    `)
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as EnrollmentWithDetails[]) ?? [];
};

// ── GET ALL ENROLLMENTS IN TENANT ────────────────────────────
export const tampilSemuaEnrollment = async (): Promise<EnrollmentWithDetails[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('enrollments')
    .select(`
      *,
      profiles!enrollments_student_id_fkey(id, full_name, phone, avatar_url),
      classes(id, name, type)
    `)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as EnrollmentWithDetails[]) ?? [];
};

// ── ENROLL STUDENT TO CLASS ────────────────────────────────
export const daftarkanMurid = async (
  studentId: string,
  classId: string,
  tenantId: string,
  parentPin: string
): Promise<Enrollment> => {
  const db = getDb();
  const { data, error } = await db
    .from('enrollments')
    .insert({
      student_id: studentId,
      class_id: classId,
      tenant_id: tenantId,
      parent_pin: parentPin,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Enrollment;
};

// ── UPDATE ENROLLMENT STATUS ───────────────────────────────
export const ubahStatusEnrollment = async (enrollmentId: string, status: 'active' | 'inactive' | 'graduated'): Promise<void> => {
  const db = getDb();
  const { error } = await db
    .from('enrollments')
    .update({ status })
    .eq('id', enrollmentId);
  if (error) throw new Error(error.message);
};

// ── UPDATE STUDENT PROFILE ─────────────────────────────────
export const ubahProfilMurid = async (studentId: string, updates: Partial<Profile>): Promise<Profile> => {
  const db = getDb();
  const { data, error } = await db
    .from('profiles')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Profile;
};

// ── VERIFY PARENT PIN ──────────────────────────────────────
export const verifikasiPinWali = async (enrollmentId: string, pin: string): Promise<boolean> => {
  const db = getDb();
  const { data, error } = await db
    .from('enrollments')
    .select('parent_pin')
    .eq('id', enrollmentId)
    .single();
  if (error || !data) return false;
  return data.parent_pin === pin;
};
