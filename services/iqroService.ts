import { createClient } from '@/lib/supabase/client';
import type { IqroProgress } from '@/types';

const getDb = () => createClient();

export const tampilRiwayatIqro = async (enrollmentId: string): Promise<IqroProgress[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('iqro_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('session_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

export const simpanIqro = async (input: {
  enrollmentId: string;
  guruId: string;
  type: 'iqro' | 'iksar';
  jilid: number;
  halaman: number;
  totalHalaman: number;
  level: 'kurang' | 'cukup' | 'lancar' | 'mahir';
  sessionDate: string;
  notes?: string;
}): Promise<IqroProgress> => {
  const db = getDb();

  // Get tenant_id from enrollment
  const { data: enrollment } = await db
    .from('enrollments')
    .select('tenant_id')
    .eq('id', input.enrollmentId)
    .single();

  const { data, error } = await db
    .from('iqro_progress')
    .insert({
      tenant_id: enrollment?.tenant_id,
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      type: input.type,
      jilid: input.jilid,
      halaman: input.halaman,
      total_halaman: input.totalHalaman,
      level: input.level,
      session_date: input.sessionDate,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as IqroProgress;
};

export const hapusIqro = async (id: string): Promise<void> => {
  const db = getDb();
  const { error } = await db.from('iqro_progress').delete().eq('id', id);
  if (error) throw new Error(error.message);
};
