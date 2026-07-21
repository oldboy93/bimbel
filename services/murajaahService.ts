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
