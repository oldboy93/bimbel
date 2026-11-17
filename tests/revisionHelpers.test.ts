import test from "node:test";
import assert from "node:assert/strict";
import {
  sortHafalanLatest,
  getLatestJuzRecord,
  getLatestClassHafalanSession,
  formatPrRange,
  shouldShowTasmiEvaluation,
  calculateCapaianTuntas,
  classifyMurojaahAge,
  calculateAttendanceScore,
  getStudentLevelInfo,
  generateAutoRaportDraft,
} from "../lib/revisionHelpers";
import type { HafalanProgress } from "../types";

test("BUG-1: sortHafalanLatest mengurutkan berdasarkan session_date DESC lalu created_at DESC", () => {
  const dummyList: HafalanProgress[] = [
    {
      id: "1",
      enrollment_id: "enr1",
      guru_id: "guru1",
      surah_number: 0,
      surah_name: "Juz 1",
      total_ayat: 21,
      ayat_reached: 21,
      session_date: "2026-11-03",
      created_at: "2026-11-03T08:00:00Z",
      status: "lulus",
    },
    {
      id: "2",
      enrollment_id: "enr1",
      guru_id: "guru1",
      surah_number: 0,
      surah_name: "Juz 4",
      total_ayat: 20,
      ayat_reached: 20,
      session_date: "2026-11-03",
      created_at: "2026-11-03T09:00:00Z",
      status: "lulus",
    },
    {
      id: "3",
      enrollment_id: "enr1",
      guru_id: "guru1",
      surah_number: 0,
      surah_name: "Juz 7",
      total_ayat: 20,
      ayat_reached: 20,
      session_date: "2026-11-03",
      created_at: "2026-11-03T11:00:00Z", // Paling baru diinput hari itu
      status: "lulus",
    },
  ];

  const sorted = sortHafalanLatest(dummyList);
  assert.equal(sorted[0].surah_name, "Juz 7", "Juz 7 harus berada di posisi teratas");
  assert.equal(sorted[2].surah_name, "Juz 1", "Juz 1 harus berada di posisi terbawah");

  const latestJuz = getLatestJuzRecord(dummyList);
  assert.equal(latestJuz?.surah_name, "Juz 7", "Latest Juz record harus Juz 7");
});

test("BUG-2 & BUG-3: formatPrRange menampilkan Halaman untuk Juz dan Ayat untuk Surat", () => {
  const juzLabel = formatPrRange({
    mode: "juz",
    from: 1,
    to: 10,
    juzNumber: 30,
  });
  assert.equal(juzLabel, "Halaman 1 - 10 (Juz 30)");

  const surahLabel = formatPrRange({
    mode: "surat",
    from: 1,
    to: 15,
  });
  assert.equal(surahLabel, "Ayat 1 - 15");
});

test("BUG-4: shouldShowTasmiEvaluation menampilkan banner saat kelipatan 5 dan hilang saat sudah tasmi / di-dismiss", () => {
  const juzRecord: HafalanProgress = {
    id: "rec1",
    enrollment_id: "enr1",
    guru_id: "guru1",
    surah_number: 0,
    surah_name: "Juz 30",
    total_ayat: 20,
    ayat_reached: 10,
    session_date: "2026-11-03",
    created_at: "2026-11-03T10:00:00Z",
    status: "lulus",
  };

  // Saat belum ada catatan tasmi'
  const evalBefore = shouldShowTasmiEvaluation({
    latestJuz: juzRecord,
    recentSessions: [juzRecord],
    dismissedKeys: new Set(),
  });
  assert.ok(evalBefore !== null, "Banner harus muncul");
  assert.equal(evalBefore?.title, "Batas Kelipatan Tercapai (10 Hlm)");

  // Saat sudah ada sesi dengan catatan tasmi'
  const evalAfterTasmi = shouldShowTasmiEvaluation({
    latestJuz: juzRecord,
    recentSessions: [
      juzRecord,
      {
        ...juzRecord,
        id: "rec2",
        created_at: "2026-11-03T11:00:00Z",
        notes: "Uji Tasmi' 10 Hlm dinyatakan Lulus Lancar",
      },
    ],
    dismissedKeys: new Set(),
  });
  assert.equal(evalAfterTasmi, null, "Banner harus hilang jika ada sesi tasmi'");

  // Saat guru menekan tombol dismiss / tutup
  const evalDismissed = shouldShowTasmiEvaluation({
    latestJuz: juzRecord,
    recentSessions: [juzRecord],
    dismissedKeys: new Set(["tasmi_Juz 30_10"]),
  });
  assert.equal(evalDismissed, null, "Banner harus hilang jika di-dismiss");
});

test("BUG-5: getLatestClassHafalanSession mengecualikan sesi PR", () => {
  const sessions: HafalanProgress[] = [
    {
      id: "pr1",
      enrollment_id: "enr1",
      guru_id: "guru1",
      surah_number: 78,
      surah_name: "An-Naba'",
      total_ayat: 40,
      ayat_reached: 10,
      session_date: "2026-11-08",
      created_at: "2026-11-08T12:00:00Z",
      is_pr: true, // ini PR simakan ortu
    },
    {
      id: "class1",
      enrollment_id: "enr1",
      guru_id: "guru1",
      surah_number: 0,
      surah_name: "Juz 30",
      total_ayat: 20,
      ayat_reached: 10,
      session_date: "2026-11-03",
      created_at: "2026-11-03T10:00:00Z",
      is_pr: false, // ini sesi hafalan kelas
    },
  ];

  const latestClass = getLatestClassHafalanSession(sessions);
  assert.equal(latestClass?.id, "class1", "Sesi kelas harus class1, bukan sesi PR");
  assert.equal(latestClass?.surah_name, "Juz 30");
});

test("ENH-1: calculateCapaianTuntas menghitung tuntas Juz dan Surat secara dinamis", () => {
  const hafalanList: HafalanProgress[] = [
    {
      id: "1",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 0,
      surah_name: "Juz 1",
      total_ayat: 21,
      ayat_reached: 21,
      session_date: "2026-07-21",
      created_at: "2026-07-21T08:00:00Z",
      status: "lulus",
    },
    {
      id: "2",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 0,
      surah_name: "Juz 4",
      total_ayat: 20,
      ayat_reached: 20,
      session_date: "2026-08-10",
      created_at: "2026-08-10T08:00:00Z",
      status: "lulus",
    },
  ];

  const result = calculateCapaianTuntas(hafalanList);
  assert.equal(result.completedJuzCount, 2);
  assert.equal(result.label, "2 Juz Tuntas", "Label harus menunjukkan 2 Juz Tuntas, bukan 0 Surat");
});

test("ENH-2: classifyMurojaahAge membedakan baru (< 30 hari) vs lama (>= 30 hari)", () => {
  const hafalanHistory: HafalanProgress[] = [
    {
      id: "h1",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 78,
      surah_name: "An-Naba'",
      total_ayat: 40,
      ayat_reached: 40,
      session_date: "2026-09-01", // 2 bulan yang lalu
      created_at: "2026-09-01T08:00:00Z",
      status: "lulus",
    },
    {
      id: "h2",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 79,
      surah_name: "An-Nazi'at",
      total_ayat: 46,
      ayat_reached: 46,
      session_date: "2026-11-01", // 7 hari yang lalu
      created_at: "2026-11-01T08:00:00Z",
      status: "lulus",
    },
  ];

  const ageAnNaba = classifyMurojaahAge({
    surahNumber: 78,
    surahName: "An-Naba'",
    sessionDate: "2026-11-08",
    hafalanList: hafalanHistory,
  });
  assert.equal(ageAnNaba, "lama", "An-Naba' dihafal September harus berstatus lama");

  const ageAnNaziat = classifyMurojaahAge({
    surahNumber: 79,
    surahName: "An-Nazi'at",
    sessionDate: "2026-11-08",
    hafalanList: hafalanHistory,
  });
  assert.equal(ageAnNaziat, "baru", "An-Nazi'at dihafal November harus berstatus baru");
});

test("ENH-3: calculateAttendanceScore menghitung skor berbasis kehadiran utama", () => {
  const scoreData = calculateAttendanceScore({
    hadirCount: 8,
    totalSesi: 10,
  });

  assert.equal(scoreData.score, 80, "Skor hadir 8 harus 80 poin");
  assert.equal(scoreData.attendanceRate, 80);

  const levelInfo = getStudentLevelInfo(3);
  assert.equal(levelInfo.label, "Level 2 (Pratama)");
});

test("ENH-4: generateAutoRaportDraft membuat periode dan entri hafalan otomatis", () => {
  const hafalanList: HafalanProgress[] = [
    {
      id: "h1",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 0,
      surah_name: "Juz 1",
      total_ayat: 21,
      ayat_reached: 21,
      session_date: "2026-11-01",
      created_at: "2026-11-01T08:00:00Z",
      status: "lulus",
    },
    {
      id: "h2",
      enrollment_id: "e1",
      guru_id: "g1",
      surah_number: 0,
      surah_name: "Juz 4",
      total_ayat: 20,
      ayat_reached: 15,
      session_date: "2026-11-05",
      created_at: "2026-11-05T08:00:00Z",
      status: "lulus",
    },
  ];

  const draft = generateAutoRaportDraft({
    classType: "tahfidz",
    hafalanList,
  });

  assert.ok(draft.suggestedPeriod.length > 0, "Periode harus terisi");
  assert.equal(draft.hafalanEntries.length, 2, "Harus ada 2 entri hafalan otomatis");
  assert.equal(draft.hafalanEntries[0].surah_atau_materi, "Juz 4");
  assert.equal(draft.hafalanEntries[1].surah_atau_materi, "Juz 1");
  assert.equal(draft.hafalanEntries[1].status, "lancar");
});
