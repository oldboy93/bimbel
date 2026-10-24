"use client";

import { useEffect, useState, useMemo } from "react";
import { tampilRiwayatHafalan } from "@/services/hafalanService";
import { tampilRiwayatIqro } from "@/services/iqroService";
import { tampilAssessmentTajwid } from "@/services/gradeService";
import { tampilAbsensiMurid } from "@/services/attendanceService";
import { QURAN_SURAHS } from "@/lib/quranData";
import { calcAttendanceRate } from "@/lib/helpers";
import type { HafalanProgress, IqroProgress, Attendance } from "@/types";
import { ChevronRight, X } from "lucide-react";

interface Props {
  enrollmentId: string;
  classType: "tahfidz" | "calistung" | "umum";
  studentName: string;
  onNavigateToSection: (sectionKey: string) => void;
}

export default function StudentSummaryCard({
  enrollmentId,
  classType,
  studentName,
  onNavigateToSection,
}: Props) {
  const [hafalanList, setHafalanList] = useState<HafalanProgress[]>([]);
  const [iqroList, setIqroList] = useState<IqroProgress[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [calistungData, setCalistungData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPetaModal, setShowPetaModal] = useState(false);
  const [filterJuz30Only, setFilterJuz30Only] = useState(true);

  const loadData = async () => {
    try {
      if (classType === "calistung") {
        const [tajwidRes, absRes] = await Promise.all([
          tampilAssessmentTajwid(enrollmentId).catch(() => []),
          tampilAbsensiMurid(enrollmentId).catch(() => []),
        ]);
        setAttendances(absRes);
        const calistungItems = tajwidRes.filter((item) => {
          try {
            const parsed = JSON.parse(item.tajwid_notes || "");
            return parsed && parsed.isCalistung === true;
          } catch {
            return false;
          }
        });
        if (calistungItems.length > 0) {
          try {
            setCalistungData(JSON.parse(calistungItems[0].tajwid_notes || "{}"));
          } catch {
            setCalistungData(null);
          }
        }
      } else {
        const [hafalan, iqro, absRes] = await Promise.all([
          tampilRiwayatHafalan(enrollmentId).catch(() => []),
          tampilRiwayatIqro(enrollmentId).catch(() => []),
          tampilAbsensiMurid(enrollmentId).catch(() => []),
        ]);
        setHafalanList(hafalan);
        setIqroList(iqro);
        setAttendances(absRes);
      }
    } catch (err) {
      console.error("Gagal memuat rangkuman murid:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener("refresh-student-summary", handleRefresh);
    return () => window.removeEventListener("refresh-student-summary", handleRefresh);
  }, [enrollmentId, classType]);

  // ── KEHADIRAN (10 sesi terakhir) ─────────────────────────
  const recentAttendances = attendances.slice(0, 10);
  const hadirCount = recentAttendances.filter((a) => a.status === "H").length;
  const totalSesi = recentAttendances.length;
  const attendanceRate = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) : null;

  // ── KALKULASI TAHFIDZ ──────────────────────────────────────────
  const latestHafalan = hafalanList[0] || null;

  // Cek PR terakhir yang belum disimak
  const latestPr = useMemo(() => {
    return hafalanList.find((h) => h.is_pr && !h.parent_simak_at) || null;
  }, [hafalanList]);

  // Jumlah sesi ngulang di surat yang sama (surat aktif)
  const ngulangCount = useMemo(() => {
    if (!latestHafalan) return 0;
    return hafalanList.filter(
      (h) =>
        h.surah_number === latestHafalan.surah_number &&
        h.surah_name === latestHafalan.surah_name &&
        (h.status ?? "lulus") === "ngulang"
    ).length;
  }, [hafalanList, latestHafalan]);

  // Peta status per surat
  const surahProgressMap = useMemo(() => {
    const map = new Map<number, { reached: number; total: number; isLulus: boolean }>();
    hafalanList.forEach((item) => {
      if (item.surah_number > 0) {
        const existing = map.get(item.surah_number);
        if (!existing || item.ayat_reached > existing.reached) {
          map.set(item.surah_number, {
            reached: item.ayat_reached,
            total: item.total_ayat,
            isLulus:
              (item.status ?? "lulus") === "lulus" &&
              item.ayat_reached >= item.total_ayat,
          });
        }
      }
    });
    return map;
  }, [hafalanList]);

  // Statistik Juz 30 (Surat 78–114)
  const juz30Stats = useMemo(() => {
    let tuntas = 0;
    let berprogres = 0;
    for (let num = 78; num <= 114; num++) {
      const data = surahProgressMap.get(num);
      if (data) {
        if (data.isLulus) tuntas++;
        else if (data.reached > 0) berprogres++;
      }
    }
    return { tuntas, berprogres, total: 37 };
  }, [surahProgressMap]);

  // Pencapaian Makro Juz Terakhir (Juz & Halaman) agar TIDAK TENGGELAM saat diisi setoran surat harian
  const latestJuzRecord = useMemo(() => {
    return (
      hafalanList.find(
        (h) => h.surah_number === 0 || h.surah_name.startsWith("Juz ")
      ) || null
    );
  }, [hafalanList]);

  // Data Makro Capaian Juz & Halaman
  const macroData = useMemo(() => {
    if (latestJuzRecord) {
      const isLulus =
        (latestJuzRecord.status ?? "lulus") === "lulus" &&
        latestJuzRecord.ayat_reached >= (latestJuzRecord.total_ayat || 20);
      const percent = Math.min(
        100,
        Math.round(
          (latestJuzRecord.ayat_reached / (latestJuzRecord.total_ayat || 20)) * 100
        )
      );
      return {
        title: latestJuzRecord.surah_name,
        subtitle: `${latestJuzRecord.ayat_reached}/${latestJuzRecord.total_ayat || 20} Halaman`,
        percent,
        isLulus,
        statusLabel: isLulus ? "Lulus" : "Sedang Ditempuh",
        date: new Date(latestJuzRecord.session_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }

    const isLulus = juz30Stats.tuntas === 37;
    const percent = Math.min(100, Math.round((juz30Stats.tuntas / 37) * 100));
    return {
      title: "Juz 30",
      subtitle: `${juz30Stats.tuntas}/37 Surat Selesai`,
      percent,
      isLulus,
      statusLabel: isLulus ? "Lulus" : "Berprogres",
      date: null,
    };
  }, [latestJuzRecord, juz30Stats]);

  // ── KALKULASI IQRO ─────────────────────────────────────────────
  const latestIqro = iqroList[0] || null;

  // ── HANDLERS ───────────────────────────────────────────────────
  const handleStartTeachingHafalan = (surahNumber?: number) => {
    setShowPetaModal(false);
    onNavigateToSection("hafalan");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-hafalan-session", {
          detail: { surahNumber },
        })
      );
    }, 150);
  };

  const handleStartTeachingIqro = () => {
    onNavigateToSection("iqro");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-iqro-session"));
    }, 150);
  };

  const handleStartTeachingCalistung = () => {
    onNavigateToSection("tajwid");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-calistung-session"));
    }, 150);
  };

  // ── REUSABLE: Baris kehadiran ringkas ─────────────────────
  const AttendanceRow = () => {
    if (attendanceRate === null) return null;
    const isRendah = attendanceRate < 70;
    return (
      <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
        <span>
          Kehadiran (10 sesi):{" "}
          <strong className={isRendah ? "text-amber-700" : "text-slate-900"}>
            {hadirCount}×
          </strong>{" "}
          hadir
        </span>
        <span
          className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
            isRendah
              ? "bg-amber-50 text-amber-800 border border-amber-200/60"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {attendanceRate}%
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-3"></div>
        <div className="h-6 bg-slate-100 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
      </div>
    );
  }

  // ── KELAS CALISTUNG ─────────────────────────────────────
  if (classType === "calistung") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Rangkuman Capaian
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
            Calistung
          </span>
        </div>

        {calistungData ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Membaca", val: calistungData.membaca_kalimat },
                { label: "Menulis", val: calistungData.menulis_kalimat },
                { label: "Berhitung", val: calistungData.hitung_operasi },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100"
                >
                  <span className="text-[10px] font-medium text-slate-500 block">{label}</span>
                  <span className="text-xs font-bold text-slate-800 capitalize">{val || "Mulai"}</span>
                </div>
              ))}
            </div>
            {calistungData.catatan_tambahan && (
              <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 italic">
                "{calistungData.catatan_tambahan}"
              </p>
            )}
            <AttendanceRow />
            <button
              onClick={handleStartTeachingCalistung}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
            >
              Input Penilaian Calistung
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              Belum ada evaluasi calistung yang tercatat untuk {studentName}.
            </p>
            <button
              onClick={handleStartTeachingCalistung}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
            >
              Mulai Penilaian Perdana
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── FOKUS IQRO (belum ada hafalan, ada iqro) ──────────────
  const isPrimarilyIqro = hafalanList.length === 0 && iqroList.length > 0;

  if (isPrimarilyIqro && latestIqro) {
    const LEVEL_LABEL: Record<string, string> = {
      kurang: "Perlu Bimbingan",
      cukup: "Cukup",
      lancar: "Lancar",
      mahir: "Sangat Mahir",
    };
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Rangkuman Capaian
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Iqro &amp; Aisar
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500">Posisi Belajar Terakhir</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {latestIqro.type === "iqro" ? "Iqro" : "Aisar"} Jilid {latestIqro.jilid} — Halaman {latestIqro.halaman}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {latestIqro.total_halaman}
              </span>
            </h3>
            {/* Progress bar halaman */}
            <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width: `${Math.round((latestIqro.halaman / latestIqro.total_halaman) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/90 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Sesi: {new Date(latestIqro.session_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="font-semibold px-2 py-0.5 rounded-md text-[11px] bg-emerald-100/80 text-emerald-800 capitalize">
                {LEVEL_LABEL[latestIqro.level] ?? latestIqro.level}
              </span>
            </div>
            {latestIqro.notes && (
              <p className="text-xs text-slate-700 italic pt-0.5 line-clamp-2">
                "{latestIqro.notes}"
              </p>
            )}
          </div>

          <AttendanceRow />

          <div className="pt-1 flex gap-2">
            <button
              onClick={handleStartTeachingIqro}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
            >
              Lanjut Mengajar Iqro
            </button>
            <button
              onClick={() => handleStartTeachingHafalan()}
              className="py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 transition"
            >
              Mulai Hafalan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── KELAS TAHFIDZ / UMUM (DEFAULT) ────────────────────────
  const isLatestLulus = (latestHafalan?.status ?? "lulus") === "lulus";
  const progressPercent = latestHafalan
    ? Math.min(100, Math.round((latestHafalan.ayat_reached / (latestHafalan.total_ayat || 1)) * 100))
    : 0;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Rangkuman Capaian
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            Tahfidz Al-Qur'an
          </span>
        </div>

        {latestHafalan ? (
          <div className="space-y-3.5">
            {/* ── 1. Posisi Pencapaian Makro: Juz & Halaman (Tidak tenggelam saat ada setoran surat harian) ── */}
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/80">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Pencapaian Hafalan (Juz & Halaman)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    macroData.isLulus
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {macroData.statusLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{macroData.title}</span>
                  {macroData.date && (
                    <span className="text-[10px] font-medium text-slate-400">
                      ({macroData.date})
                    </span>
                  )}
                </h3>
                <span className="text-xs font-bold text-emerald-900">
                  {macroData.subtitle}
                </span>
              </div>

              <div className="h-2 bg-emerald-200/50 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    macroData.isLulus ? "bg-emerald-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${macroData.percent}%` }}
                />
              </div>
            </div>

            {/* ── 2. Sesi Terakhir Murid (Surat/Ayat Harian) ── */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sesi Terakhir:
                  </span>
                  <strong className="text-slate-800 font-bold">
                    {latestHafalan.surah_name}
                  </strong>
                  <span className="text-slate-500 font-medium">
                    ({latestHafalan.ayat_reached}/{latestHafalan.total_ayat}{" "}
                    {latestHafalan.surah_number === 0 ? "hlm" : "ayat"})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {ngulangCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Ngulang {ngulangCount}×
                    </span>
                  )}
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border ${
                      isLatestLulus
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {isLatestLulus ? "Lulus" : "Ngulang"}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Tanggal:{" "}
                {new Date(latestHafalan.session_date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>

              {latestHafalan.notes ? (
                <p className="text-xs text-slate-600 italic bg-white/70 p-2 rounded-xl border border-slate-100 line-clamp-2">
                  "{latestHafalan.notes}"
                </p>
              ) : null}
            </div>

            {/* ── 3. PR belum disimak ── */}
            {latestPr && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200/70 rounded-xl px-3 py-2">
                <span className="shrink-0 mt-0.5 text-amber-600">⚠</span>
                <span className="text-amber-800">
                  PR <strong>{latestPr.surah_name}</strong> ({latestPr.ayat_reached}/{latestPr.total_ayat} {latestPr.surah_number === 0 ? "hlm" : "ayat"}) belum disimak orang tua.
                </span>
              </div>
            )}

            {/* ── 4. Statistik bawah: Peta Surat & Kehadiran ── */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  Surat Selesai: <strong className="text-slate-900">{juz30Stats.tuntas}</strong>/37 di Juz 30
                  {juz30Stats.berprogres > 0 && (
                    <span className="text-slate-400"> · {juz30Stats.berprogres} proses</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPetaModal(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5"
                >
                  Peta Surat <ChevronRight size={13} />
                </button>
              </div>
              <AttendanceRow />
            </div>

            {/* ── 5. Tombol utama ── */}
            <button
              onClick={() => handleStartTeachingHafalan()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition mt-1"
            >
              Input Sesi Hari Ini
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="space-y-3 py-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              Belum ada catatan hafalan untuk {studentName}. Mulai setoran pertama ananda sekarang.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleStartTeachingHafalan(78)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
              >
                Mulai Setoran Hafalan
              </button>
              <button
                onClick={handleStartTeachingIqro}
                className="py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 transition"
              >
                Modul Iqro
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL PETA SURAT ─────────────────────────────── */}
      {showPetaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] shadow-xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Peta Hafalan Surat</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ketuk surat untuk langsung input setoran surat tersebut
                </p>
              </div>
              <button
                onClick={() => setShowPetaModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {[
                  { label: "Juz 30", val: true },
                  { label: "Semua Surat", val: false },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFilterJuz30Only(val)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      filterJuz30Only === val
                        ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Tuntas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Proses
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span> Belum
                </span>
              </div>
            </div>

            {/* Grid surat */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QURAN_SURAHS.filter((s) => (filterJuz30Only ? s.number >= 78 : true)).map((surah) => {
                  const progress = surahProgressMap.get(surah.number);
                  const isCompleted = progress?.isLulus ?? false;
                  const isInProgress = !isCompleted && progress && progress.reached > 0;

                  return (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => handleStartTeachingHafalan(surah.number)}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between ${
                        isCompleted
                          ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/60"
                          : isInProgress
                          ? "bg-blue-50/50 border-blue-200 hover:bg-blue-100/60"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold text-slate-400">#{surah.number}</span>
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 rounded">
                            Tuntas
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 rounded">
                            {progress.reached}/{surah.ayat}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-xs text-slate-800 mt-1 truncate">{surah.name}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">{surah.ayat} ayat</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPetaModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
