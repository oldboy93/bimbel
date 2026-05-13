/**
 * KHANZA STYLE SEQUEL HELPER
 * Class helper untuk memudahkan manipulasi database CRUD ke Supabase.
 */
import { createClient } from '@/lib/supabase/client';

// Helper bawaan ini menggunakan browser client (berjalan di sisi React).
// Anda dapat membuat instance 'db' per service jika dibutuhkan.
const db = createClient();

export const Sekuel = {
  /**
   * Mengambil semua data dari sebuah tabel
   */
  tampil: async (tabel: string, kolom: string = '*') => {
    const { data, error } = await db.from(tabel).select(kolom);
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Menyimpan data baru ke tabel
   */
  simpan: async (tabel: string, dataInput: any) => {
    const { data, error } = await db.from(tabel).insert(dataInput).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Mengubah data yang sudah ada berdasarkan ID
   */
  ubah: async (tabel: string, id: string, dataUpdate: any) => {
    const { data, error } = await db.from(tabel).update(dataUpdate).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Menghapus data berdasarkan ID
   */
  hapus: async (tabel: string, id: string) => {
    const { error } = await db.from(tabel).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
};
