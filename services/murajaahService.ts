import { createClient } from '@/lib/supabase/client';
import type { MurajaahSession } from '@/types';

const getDb = () => createClient();

export const tampilRiwayatMurajaah = async (enrollmentId: string): Promise<MurajaahSession[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('murajaah_sessions')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── AMBIL TUGAS RUMAH (PR) MURAJAAH ─────────────────────────
export const tampilPrMurajaah = async (enrollmentId: string): Promise<MurajaahSession[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('murajaah_sessions')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('is_pr', true)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const simpanMurajaah = async (input: {
  enrollmentId: string;
  guruId: string;
  hafalanRefId?: string;
  hafalanType: 'surat' | 'juz';
  surahNumber?: number;
  surahName: string;
  ayatOrPageRange?: string;
  quality: 'lancar' | 'perlu_perbaikan' | 'mengulang';
  sessionDate: string;
  notes?: string;
  is_pr?: boolean;
  pr_notes_guru?: string;
}): Promise<MurajaahSession> => {
  const db = getDb();

  // Get tenant_id from enrollment
  const { data: enrollment } = await db
    .from('enrollments')
    .select('tenant_id')
    .eq('id', input.enrollmentId)
    .single();

  const { data, error } = await db
    .from('murajaah_sessions')
    .insert({
      tenant_id: enrollment?.tenant_id,
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      hafalan_ref_id: input.hafalanRefId,
      hafalan_type: input.hafalanType,
      surah_number: input.surahNumber,
      surah_name: input.surahName,
      ayat_or_page_range: input.ayatOrPageRange,
      quality: input.quality,
      session_date: input.sessionDate,
      notes: input.notes,
      is_pr: input.is_pr ?? false,
      pr_notes_guru: input.pr_notes_guru ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MurajaahSession;
};

// ── SIMPAN TUGAS RUMAH (PR) MURAJAAH INDEPENDEN ────────────
export const simpanPrMurajaah = async (input: {
  enrollmentId: string;
  guruId: string;
  hafalanType: 'surat' | 'juz';
  surahNumber?: number;
  surahName: string;
  ayatOrPageRange: string;
  sessionDate: string;
  prNotesGuru: string;
}): Promise<MurajaahSession> => {
  return simpanMurajaah({
    enrollmentId: input.enrollmentId,
    guruId: input.guruId,
    hafalanType: input.hafalanType,
    surahNumber: input.surahNumber,
    surahName: input.surahName,
    ayatOrPageRange: input.ayatOrPageRange,
    quality: 'lancar',
    sessionDate: input.sessionDate,
    is_pr: true,
    pr_notes_guru: input.prNotesGuru,
  });
};

export const hapusMurajaah = async (id: string): Promise<void> => {
  const db = getDb();
  const { error } = await db.from('murajaah_sessions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// ── UPDATE NILAI SIMAKAN ORANG TUA (MURAJAAH) ─────────────────
export const updateParentFeedbackMurajaah = async (input: {
  murajaahId: string;
  parentRating: number;
  parentStatus: 'lancar' | 'cukup' | 'perlu_bimbingan';
  parentNotes?: string;
}): Promise<void> => {
  const res = await fetch('/api/pr/simak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'murajaah',
      id: input.murajaahId,
      rating: input.parentRating,
      status: input.parentStatus,
      notes: input.parentNotes,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyimpan penilaian simakan murajaah.');
  }
};

