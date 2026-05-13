/**
 * scheduleService.ts
 * Layer abstraksi query Supabase untuk modul Jadwal Belajar.
 */
import { createClient } from '@/lib/supabase/client';
import type { Schedule } from '@/types';

const getDb = () => createClient();

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

// ── AMBIL JADWAL PER ENROLLMENT ────────────────────────────
export const tampilJadwal = async (enrollmentId: string): Promise<Schedule[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('day_of_week');
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── TAMBAH ITEM JADWAL ─────────────────────────────────────
export const simpanJadwal = async (input: Omit<Schedule, 'id' | 'created_at'>): Promise<Schedule> => {
  const db = getDb();
  const { data, error } = await db
    .from('schedules')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Schedule;
};

// ── HAPUS ITEM JADWAL ──────────────────────────────────────
export const hapusJadwal = async (scheduleId: string): Promise<void> => {
  const db = getDb();
  const { error } = await db.from('schedules').delete().eq('id', scheduleId);
  if (error) throw new Error(error.message);
};

// ── JADWAL HARI INI ────────────────────────────────────────
export const filterJadwalHariIni = (schedules: Schedule[]): Schedule[] => {
  const today = new Date().getDay();
  return schedules.filter((s) => s.day_of_week === today);
};

// ── NAMA HARI ──────────────────────────────────────────────
export const namaHari = (dayIndex: number): string => DAY_NAMES[dayIndex] ?? '-';
