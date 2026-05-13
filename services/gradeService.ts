/**
 * gradeService.ts
 * Layer abstraksi query Supabase untuk modul Raport / Penilaian.
 */
import { createClient } from '@/lib/supabase/client';
import type { ReportCard, TajwidAssessment } from '@/types';

const getDb = () => createClient();

// ══════════════════════════════════════════
// RAPORT
// ══════════════════════════════════════════

export const tampilRaport = async (enrollmentId: string): Promise<ReportCard[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('report_cards')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const simpanRaport = async (input: {
  enrollmentId: string;
  guruId: string;
  period: string;
  scores: Record<string, number>;
  summary: string;
}): Promise<ReportCard> => {
  const db = getDb();
  const { data, error } = await db
    .from('report_cards')
    .insert({
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      period: input.period,
      scores: input.scores,
      summary: input.summary,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ReportCard;
};

export const publikasiRaport = async (reportId: string): Promise<void> => {
  const db = getDb();
  const { error } = await db
    .from('report_cards')
    .update({ published_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) throw new Error(error.message);
};

// ══════════════════════════════════════════
// TAJWID ASSESSMENT
// ══════════════════════════════════════════

export const tampilAssessmentTajwid = async (enrollmentId: string): Promise<TajwidAssessment[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('tajwid_assessments')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const simpanAssessmentTajwid = async (input: {
  enrollmentId: string;
  guruId: string;
  sessionDate: string;
  makhrajLevel: 'mulai' | 'sedang' | 'lancar';
  makhrajNotes?: string;
  kelancaranLevel: 'mulai' | 'sedang' | 'lancar';
  kelancaranNotes?: string;
  tajwidLevel: 'mulai' | 'sedang' | 'lancar';
  tajwidNotes?: string;
}): Promise<TajwidAssessment> => {
  const db = getDb();
  const { data, error } = await db
    .from('tajwid_assessments')
    .insert({
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      session_date: input.sessionDate,
      makhraj_level: input.makhrajLevel,
      makhraj_notes: input.makhrajNotes ?? '',
      kelancaran_level: input.kelancaranLevel,
      kelancaran_notes: input.kelancaranNotes ?? '',
      tajwid_level: input.tajwidLevel,
      tajwid_notes: input.tajwidNotes ?? '',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TajwidAssessment;
};
