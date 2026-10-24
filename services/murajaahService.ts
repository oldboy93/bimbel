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
  const db = getDb();
  const { error } = await db
    .from('murajaah_sessions')
    .update({
      parent_rating: input.parentRating,
      parent_status: input.parentStatus,
      parent_notes: input.parentNotes ?? null,
      parent_simak_at: new Date().toISOString(),
    })
    .eq('id', input.murajaahId);
  if (error) throw new Error(error.message);
};

