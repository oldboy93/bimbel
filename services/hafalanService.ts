/**
 * hafalanService.ts
 * Layer abstraksi query Supabase untuk modul Progress Hafalan.
 */
import { createClient } from '@/lib/supabase/client';
import type { HafalanProgress } from '@/types';

const getDb = () => createClient();

// ── AMBIL RIWAYAT HAFALAN MURID ────────────────────────────
export const tampilRiwayatHafalan = async (enrollmentId: string): Promise<HafalanProgress[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('hafalan_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── AMBIL TUGAS RUMAH (PR) HAFALAN ─────────────────────────
export const tampilPrHafalan = async (enrollmentId: string): Promise<HafalanProgress[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('hafalan_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('is_pr', true)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── AMBIL HAFALAN TERKINI (surat terakhir yang dipelajari) ─
export const tampilHafalanTerkini = async (enrollmentId: string): Promise<HafalanProgress | null> => {
  const db = getDb();
  const { data } = await db
    .from('hafalan_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('session_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
};

// ── SIMPAN SESI HAFALAN ────────────────────────────────────
export const simpanHafalan = async (input: {
  enrollmentId: string;
  guruId: string;
  mode: 'surat' | 'juz';
  surahNumber?: number;
  surahName: string;
  totalAyat: number;
  ayatReached: number;
  sessionDate: string;
  notes?: string;
  juzNumber?: number;
  status?: 'lulus' | 'ngulang';
  is_pr?: boolean;
  pr_notes_guru?: string;
}): Promise<HafalanProgress> => {
  const db = getDb();
  const baseQuery = db.from('hafalan_progress').select('*').eq('enrollment_id', input.enrollmentId).order('session_date', { ascending: false }).limit(1);

  const matchingQuery = input.mode === 'surat'
    ? baseQuery.eq('surah_number', input.surahNumber)
    : baseQuery.eq('surah_number', 0).eq('surah_name', `Juz ${input.juzNumber}`);

  const { data: existing, error: existingError } = await matchingQuery.maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    const { data, error } = await db
      .from('hafalan_progress')
      .update({
        guru_id: input.guruId,
        surah_number: input.mode === 'juz' ? 0 : input.surahNumber,
        surah_name: input.surahName,
        total_ayat: input.totalAyat,
        ayat_reached: input.ayatReached,
        session_date: input.sessionDate,
        notes: input.notes ?? '',
        status: input.status ?? 'lulus',
        is_pr: input.is_pr ?? false,
        pr_notes_guru: input.pr_notes_guru ?? null,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as HafalanProgress;
  }

  const { data, error } = await db
    .from('hafalan_progress')
    .insert({
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      surah_number: input.mode === 'juz' ? 0 : input.surahNumber,
      surah_name: input.surahName,
      total_ayat: input.totalAyat,
      ayat_reached: input.ayatReached,
      session_date: input.sessionDate,
      notes: input.notes ?? '',
      status: input.status ?? 'lulus',
      is_pr: input.is_pr ?? false,
      pr_notes_guru: input.pr_notes_guru ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HafalanProgress;
};

// ── UPDATE NILAI SIMAKAN ORANG TUA (HAFALAN) ───────────────
export const updateParentFeedbackHafalan = async (input: {
  hafalanId: string;
  parentRating: number;
  parentStatus: 'lancar' | 'cukup' | 'perlu_bimbingan';
  parentNotes?: string;
}): Promise<void> => {
  const res = await fetch('/api/pr/simak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'hafalan',
      id: input.hafalanId,
      rating: input.parentRating,
      status: input.parentStatus,
      notes: input.parentNotes,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyimpan penilaian simakan hafalan.');
  }
};

// ── SIMPAN TUGAS RUMAH (PR) HAFALAN INDEPENDEN ──────────────
export const simpanPrHafalan = async (input: {
  enrollmentId: string;
  guruId: string;
  surahNumber?: number;
  surahName: string;
  totalAyat: number;
  ayatReached: number;
  sessionDate: string;
  prNotesGuru: string;
}): Promise<HafalanProgress> => {
  const db = getDb();
  const { data, error } = await db
    .from('hafalan_progress')
    .insert({
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      surah_number: input.surahNumber ?? 0,
      surah_name: input.surahName,
      total_ayat: input.totalAyat,
      ayat_reached: input.ayatReached,
      session_date: input.sessionDate,
      is_pr: true,
      pr_notes_guru: input.prNotesGuru,
      status: 'lulus',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as HafalanProgress;
};

// ── HAPUS SESI HAFALAN ─────────────────────────────────────
export const hapusHafalan = async (hafalanId: string): Promise<void> => {
  const db = getDb();
  const { error } = await db.from('hafalan_progress').delete().eq('id', hafalanId);
  if (error) throw new Error(error.message);
};

// ── HITUNG PERSENTASE HAFALAN ──────────────────────────────
export const hitungPersenHafalan = (ayatReached: number, totalAyat: number): number => {
  if (totalAyat <= 0) return 0;
  return Math.round((ayatReached / totalAyat) * 100);
};
