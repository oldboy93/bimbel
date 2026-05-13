/**
 * attendanceService.ts
 * Layer abstraksi query Supabase untuk modul Absensi.
 */
import { createClient } from '@/lib/supabase/client';
import type { Attendance } from '@/types';

const getDb = () => createClient();

// ── AMBIL ABSENSI MURID (per enrollment) ───────────────────
export const tampilAbsensiMurid = async (enrollmentId: string): Promise<Attendance[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('attendances')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── ABSENSI PER BULAN ──────────────────────────────────────
export const tampilAbsensiPerBulan = async (
  enrollmentId: string,
  year: number,
  month: number
): Promise<Attendance[]> => {
  const db = getDb();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const { data, error } = await db
    .from('attendances')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── INPUT ABSENSI HARIAN ───────────────────────────────────
export const simpanAbsensi = async (
  enrollmentId: string,
  guruId: string,
  tenantId: string,
  date: string,
  status: 'H' | 'I' | 'A',
  notes?: string
): Promise<Attendance> => {
  const db = getDb();

  // Upsert: kalau sudah ada absensi untuk tanggal tersebut, update
  const { data, error } = await db
    .from('attendances')
    .upsert(
      {
        enrollment_id: enrollmentId,
        guru_id: guruId,
        tenant_id: tenantId,
        date,
        status,
        notes: notes ?? '',
      },
      { onConflict: 'enrollment_id,date' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Attendance;
};

// ── STATISTIK KEHADIRAN ────────────────────────────────────
export const hitungStatistikAbsensi = (records: Attendance[]) => {
  const total = records.length;
  const hadir = records.filter((r) => r.status === 'H').length;
  const ijin = records.filter((r) => r.status === 'I').length;
  const alpha = records.filter((r) => r.status === 'A').length;
  const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

  return { total, hadir, ijin, alpha, persentase };
};

// ── ABSENSI HARI INI (cek apakah sudah diisi) ─────────────
export const cekAbsensiHariIni = async (enrollmentId: string): Promise<Attendance | null> => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await db
    .from('attendances')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('date', today)
    .maybeSingle();
  return data ?? null;
};
