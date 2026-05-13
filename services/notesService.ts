/**
 * notesService.ts
 * Layer abstraksi query Supabase untuk modul Catatan Guru.
 */
import { createClient } from '@/lib/supabase/client';
import type { TeacherNote } from '@/types';

const getDb = () => createClient();

// ── AMBIL CATATAN MURID ────────────────────────────────────
export const tampilCatatan = async (enrollmentId: string): Promise<TeacherNote[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('teacher_notes')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('note_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── AMBIL CATATAN YANG BOLEH DILIHAT WALI ─────────────────
export const tampilCatatanUntukWali = async (enrollmentId: string): Promise<TeacherNote[]> => {
  const db = getDb();
  const { data, error } = await db
    .from('teacher_notes')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('is_visible_to_wali', true)
    .order('note_date', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
};

// ── SIMPAN CATATAN BARU ────────────────────────────────────
export const simpanCatatan = async (input: {
  enrollmentId: string;
  guruId: string;
  noteDate: string;
  content: string;
  isVisibleToWali: boolean;
}): Promise<TeacherNote> => {
  const db = getDb();
  const { data, error } = await db
    .from('teacher_notes')
    .insert({
      enrollment_id: input.enrollmentId,
      guru_id: input.guruId,
      note_date: input.noteDate,
      content: input.content,
      is_visible_to_wali: input.isVisibleToWali,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TeacherNote;
};

// ── HAPUS CATATAN ──────────────────────────────────────────
export const hapusCatatan = async (noteId: string): Promise<void> => {
  const db = getDb();
  const { error } = await db.from('teacher_notes').delete().eq('id', noteId);
  if (error) throw new Error(error.message);
};

// ── TOGGLE VISIBILITAS KE WALI ─────────────────────────────
export const toggleVisibilitasCatatan = async (noteId: string, isVisible: boolean): Promise<void> => {
  const db = getDb();
  const { error } = await db
    .from('teacher_notes')
    .update({ is_visible_to_wali: isVisible })
    .eq('id', noteId);
  if (error) throw new Error(error.message);
};
