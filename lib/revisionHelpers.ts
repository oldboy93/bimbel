/**
 * lib/revisionHelpers.ts
 * Kumpulan pure function untuk kalkulasi capaian hafalan, evaluasi tasmi',
 * penugasan PR, leaderboard kehadiran, dan auto-fill raport.
 */

import type { HafalanProgress, MurajaahSession } from "@/types";

export interface MacroJuzInfo {
  title: string;
  subtitle: string;
  halamanTuntas: number;
  totalHalaman: number;
  percent: number;
  isLulus: boolean;
  statusLabel: string;
  date: string | null;
  rawRecord: HafalanProgress | null;
}

/**
 * BUG-1: Mengurutkan list riwayat hafalan terbaru ke terlama secara stabil.
 * Prioritas: session_date DESC -> created_at DESC -> id DESC.
 */
export function sortHafalanLatest<T extends { session_date: string; created_at?: string; id?: string }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const dateDiff = new Date(b.session_date).getTime() - new Date(a.session_date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b.id || "").localeCompare(a.id || "");
  });
}

/**
 * BUG-1: Mendapatkan record Juz terakhir murid secara akurat.
 */
export function getLatestJuzRecord(hafalanList: HafalanProgress[]): HafalanProgress | null {
  const sorted = sortHafalanLatest(hafalanList);
  return sorted.find((h) => h.surah_number === 0 || h.surah_name.startsWith("Juz ")) || null;
}

/**
 * BUG-5: Mendapatkan sesi hafalan kelas (non-PR) terakhir.
 */
export function getLatestClassHafalanSession(hafalanList: HafalanProgress[]): HafalanProgress | null {
  const sorted = sortHafalanLatest(hafalanList);
  return sorted.find((h) => !h.is_pr) || null;
}

/**
 * BUG-2 & BUG-3: Format label penugasan PR (Halaman untuk Juz, Ayat untuk Surat).
 */
export function formatPrRange(params: {
  mode: "surat" | "juz";
  from: number;
  to: number;
  total?: number;
  juzNumber?: number;
}): string {
  if (params.mode === "juz") {
    const jSuffix = params.juzNumber ? ` (Juz ${params.juzNumber})` : "";
    return `Halaman ${params.from} - ${params.to}${jSuffix}`;
  }
  return `Ayat ${params.from} - ${params.to}`;
}

/**
 * BUG-4: Evaluasi apakah banner Tasmi' perlu dimunculkan.
 * Banner tidak muncul jika:
 * 1. Sudah di-dismiss secara manual oleh guru (dismissedKeys).
 * 2. Sudah ada sesi terbaru yang mencatat kata "tasmi" di notes.
 * 3. Halaman yang dicapai bukan kelipatan 5 atau 0.
 */
export function shouldShowTasmiEvaluation(params: {
  latestJuz: HafalanProgress | null;
  recentSessions: HafalanProgress[];
  dismissedKeys?: Set<string>;
}): {
  shouldShow: boolean;
  dismissKey: string;
  title: string;
  desc: string;
  buttonText: string;
} | null {
  const { latestJuz, recentSessions, dismissedKeys = new Set() } = params;
  if (!latestJuz) return null;

  const reached = latestJuz.ayat_reached;
  const total = latestJuz.total_ayat || 20;
  const juzName = latestJuz.surah_name;
  const dismissKey = `tasmi_${juzName}_${reached}`;

  if (dismissedKeys.has(dismissKey)) {
    return null;
  }

  // Cek apakah ada sesi hafalan terbaru di juz & halaman tersebut yang sudah bertanda tasmi'
  const hasTasmiSession = recentSessions.some((s) => {
    const isSameJuz = s.surah_name === juzName || s.surah_number === 0;
    const hasNote = Boolean(s.notes && s.notes.toLowerCase().includes("tasmi"));
    return isSameJuz && hasNote && s.ayat_reached >= reached;
  });

  if (hasTasmiSession) {
    return null;
  }

  if (reached >= total) {
    return {
      shouldShow: true,
      dismissKey,
      title: `Tuntas ${juzName}!`,
      desc: `Ananda telah menyelesaikan ${reached}/${total} halaman. Siap untuk Ujian Kenaikan Juz.`,
      buttonText: "Ujian Kenaikan Juz",
    };
  }

  if (reached > 0 && reached % 5 === 0) {
    return {
      shouldShow: true,
      dismissKey,
      title: `Batas Kelipatan Tercapai (${reached} Hlm)`,
      desc: `Target kelipatan ${reached} halaman ${juzName} tercapai. Siap untuk Uji Tasmi'.`,
      buttonText: `Uji Tasmi' ${reached} Hlm`,
    };
  }

  return null;
}

/**
 * ENH-1: Menghitung capaian tuntas surat & juz secara komprehensif.
 */
export function calculateCapaianTuntas(hafalanList: HafalanProgress[]): {
  completedJuzCount: number;
  completedSurahCount: number;
  label: string;
} {
  // Hitung juz tuntas
  const completedJuzSet = new Set<string>();
  const completedSurahSet = new Set<number>();

  hafalanList.forEach((item) => {
    const isLulus = (item.status ?? "lulus") === "lulus";
    if (!isLulus) return;

    if (item.surah_number === 0 || item.surah_name.startsWith("Juz ")) {
      const total = item.total_ayat || 20;
      if (item.ayat_reached >= total) {
        completedJuzSet.add(item.surah_name);
      }
    } else if (item.surah_number > 0) {
      if (item.ayat_reached >= item.total_ayat) {
        completedSurahSet.add(item.surah_number);
      }
    }
  });

  const jCount = completedJuzSet.size;
  const sCount = completedSurahSet.size;

  let label = "0 Surat";
  if (jCount > 0 && sCount > 0) {
    label = `${jCount} Juz · ${sCount} Surat`;
  } else if (jCount > 0) {
    label = `${jCount} Juz Tuntas`;
  } else if (sCount > 0) {
    label = `${sCount} Surat`;
  }

  return {
    completedJuzCount: jCount,
    completedSurahCount: sCount,
    label,
  };
}

/**
 * ENH-2: Menentukan apakah muroja'ah termasuk "Hafalan Baru" (< 30 hari)
 * atau "Hafalan Lama" (>= 30 hari) berdasarkan tanggal pertama kelulusan hafalan tersebut.
 */
export function classifyMurojaahAge(params: {
  surahNumber: number;
  surahName: string;
  sessionDate: string;
  hafalanList: HafalanProgress[];
}): "baru" | "lama" {
  const { surahNumber, surahName, sessionDate, hafalanList } = params;
  const murojaahDate = new Date(sessionDate).getTime();

  // Cari sesi setoran kelulusan awal surat/juz ini di hafalan_progress
  const matchingHafalan = hafalanList.filter((h) => {
    if (surahNumber > 0) return h.surah_number === surahNumber;
    return h.surah_name === surahName || (h.surah_number === 0 && h.surah_name.startsWith("Juz "));
  });

  if (matchingHafalan.length === 0) {
    return "baru"; // Default jika tidak ada data pembanding
  }

  // Ambil tanggal hafalan paling awal
  const earliestDate = Math.min(...matchingHafalan.map((h) => new Date(h.session_date).getTime()));
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (murojaahDate - earliestDate > thirtyDaysMs) {
    return "lama";
  }
  return "baru";
}

/**
 * ENH-3: Menghitung skor leaderboard berbasis kehadiran utama (1 hadir = 10 poin)
 * serta menghitung level capaian murid.
 */
export function calculateAttendanceScore(params: {
  hadirCount: number;
  totalSesi: number;
}): {
  score: number;
  attendanceRate: number;
} {
  const { hadirCount, totalSesi } = params;
  const attendanceRate = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) : 0;
  // Poin berbasis kehadiran: 10 poin per kehadiran
  const score = hadirCount * 10;
  return { score, attendanceRate };
}

/**
 * Menghitung Level Murid dari jumlah juz yang sudah tuntas.
 */
export function getStudentLevelInfo(completedJuzCount: number): {
  level: number;
  label: string;
  badgeText: string;
} {
  if (completedJuzCount >= 10) return { level: 5, label: "Level 5 (Mutqin)", badgeText: "Level 5 · Mutqin" };
  if (completedJuzCount >= 6) return { level: 4, label: "Level 4 (Utama)", badgeText: "Level 4 · Utama" };
  if (completedJuzCount >= 4) return { level: 3, label: "Level 3 (Madya)", badgeText: "Level 3 · Madya" };
  if (completedJuzCount >= 2) return { level: 2, label: "Level 2 (Pratama)", badgeText: "Level 2 · Pratama" };
  return { level: 1, label: "Level 1 (Juz 'Amma)", badgeText: "Level 1 · Juz 'Amma" };
}

/**
 * ENH-4: Menghasilkan rekomendasi periode dan capaian hafalan otomatis untuk form raport baru.
 */
export function generateAutoRaportDraft(params: {
  classType: "tahfidz" | "calistung" | "umum";
  hafalanList: HafalanProgress[];
}): {
  suggestedPeriod: string;
  hafalanEntries: Array<{
    surah_atau_materi: string;
    status: "lancar" | "perlu_ulang" | "dalam_proses";
    catatan: string;
  }>;
} {
  const { classType, hafalanList } = params;
  const now = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();
  const suggestedPeriod = `${currentMonth} ${currentYear}`;

  if (classType !== "tahfidz" || hafalanList.length === 0) {
    return {
      suggestedPeriod,
      hafalanEntries: [
        { surah_atau_materi: "", status: "dalam_proses", catatan: "" },
      ],
    };
  }

  // Buat rangkuman capaian per surat / juz
  const sorted = sortHafalanLatest(hafalanList);
  const seen = new Set<string>();
  const entries: Array<{
    surah_atau_materi: string;
    status: "lancar" | "perlu_ulang" | "dalam_proses";
    catatan: string;
  }> = [];

  for (const h of sorted) {
    const key = h.surah_name;
    if (seen.has(key)) continue;
    seen.add(key);

    const isLulus = (h.status ?? "lulus") === "lulus";
    const isFull = h.ayat_reached >= (h.total_ayat || 20);
    const isJuz = h.surah_number === 0 || h.surah_name.startsWith("Juz ");
    const unit = isJuz ? "Halaman" : "Ayat";

    let status: "lancar" | "perlu_ulang" | "dalam_proses" = "dalam_proses";
    if (isLulus && isFull) status = "lancar";
    else if (!isLulus) status = "perlu_ulang";

    entries.push({
      surah_atau_materi: h.surah_name,
      status,
      catatan: `${h.ayat_reached}/${h.total_ayat || 20} ${unit} (${isLulus ? "Lulus" : "Ngulang"})`,
    });

    if (entries.length >= 6) break; // Batasi maksimal 6 capaian paling relevan
  }

  return {
    suggestedPeriod,
    hafalanEntries: entries.length > 0 ? entries : [{ surah_atau_materi: "", status: "dalam_proses", catatan: "" }],
  };
}

