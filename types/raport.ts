/**
 * types/raport.ts
 * Tipe data fleksibel untuk sistem raport multi-template.
 * Setiap class_type bisa memiliki struktur data-nya sendiri.
 * Tambahkan tipe baru di sini untuk mendukung kelas jenis lain.
 */

// ── Level penilaian universal ───────────────────────────────────────────────
export type NilaiLevel = 'belum' | 'mulai' | 'berkembang' | 'baik' | 'sangat_baik';

export const NILAI_LABEL: Record<NilaiLevel, { label: string; color: string; bg: string }> = {
  belum:       { label: 'Belum',       color: 'text-slate-500',  bg: 'bg-slate-100'   },
  mulai:       { label: 'Mulai',       color: 'text-red-600',    bg: 'bg-red-50'      },
  berkembang:  { label: 'Berkembang',  color: 'text-amber-600',  bg: 'bg-amber-50'    },
  baik:        { label: 'Baik',        color: 'text-blue-600',   bg: 'bg-blue-50'     },
  sangat_baik: { label: 'Sangat Baik', color: 'text-emerald-600',bg: 'bg-emerald-50'  },
};

// ── Struktur data raport per tipe kelas ────────────────────────────────────

/** Data raport untuk kelas CALISTUNG */
export interface RaportDataCalistung {
  // Target Membaca
  membaca_gambar:        NilaiLevel;
  membaca_kalimat:       NilaiLevel;
  kalimat_sederhana:     NilaiLevel;
  huruf_kapital:         NilaiLevel;
  intonasi_membaca:      NilaiLevel;
  mengeja_suku_kata:     NilaiLevel;
  tanda_baca:            NilaiLevel;
  // Target Menulis
  cara_memegang_alat:    NilaiLevel;
  huruf_besar_kecil:     NilaiLevel;
  menulis_kalimat:       NilaiLevel;
  // Target Menghitung
  bilangan_puluhan:      NilaiLevel;
  penjumlahan_pengurangan: NilaiLevel;
  // Narasi & Rekomendasi
  narasi_guru:           string;
  rekomendasi:           string;
  signature?:            string; // Tanda tangan guru pembimbing (base64)
}

/** Data raport untuk kelas TAHFIDZ */
export interface RaportDataTahfidz {
  // Hafalan
  hafalan_entries: {
    surah_atau_materi: string;
    status:           'lancar' | 'perlu_ulang' | 'dalam_proses';
    catatan:          string;
  }[];
  // Tajwid
  tajwid_makhraj:    NilaiLevel;
  tajwid_kelancaran: NilaiLevel;
  tajwid_kefasihan:  NilaiLevel;
  // Adab & Sikap
  adab_belajar:      NilaiLevel;
  // Narasi & Rekomendasi
  narasi_guru:       string;
  rekomendasi:       string;
  signature?:        string; // Tanda tangan guru pembimbing (base64)
}

/** Default/umum untuk tipe kelas lain (extensible) */
export interface RaportDataUmum {
  aspek_penilaian: {
    nama:  string;
    nilai: NilaiLevel;
  }[];
  narasi_guru:  string;
  rekomendasi:  string;
}

// ── Union type untuk semua kemungkinan data raport ─────────────────────────
export type RaportData = RaportDataCalistung | RaportDataTahfidz | RaportDataUmum;

// ── Entitas raport di database (diperluas dari ReportCard lama) ────────────
export interface RaportEntry {
  id:            string;
  enrollment_id: string;
  guru_id:       string;
  class_type:    'calistung' | 'tahfidz' | 'umum';
  period:        string;
  data:          RaportData;
  summary?:      string;       // legacy, tetap disimpan untuk kompatibilitas
  scores?:       Record<string, number>; // legacy
  published_at?: string | null;
  created_at:    string;
}

// ── Props shared untuk semua komponen template raport ─────────────────────
export interface RaportTemplateProps {
  raport:      RaportEntry;
  studentName: string;
  className:   string;
  tenantName:  string;
  guruName?:   string;
}
