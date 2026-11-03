"use client";

import { useEffect, useState, useMemo } from "react";
import { tampilRiwayatHafalan, hapusHafalan } from "@/services/hafalanService";
import { tampilRiwayatMurajaah, hapusMurajaah } from "@/services/murajaahService";
import { tampilRiwayatIqro } from "@/services/iqroService";
import { tampilAssessmentTajwid } from "@/services/gradeService";
import { tampilAbsensiMurid } from "@/services/attendanceService";
import { QURAN_SURAHS } from "@/lib/quranData";
import { calcAttendanceRate } from "@/lib/helpers";
import type { HafalanProgress, MurajaahSession, IqroProgress, Attendance } from "@/types";
import { ChevronRight, X } from "lucide-react";
import ModalBeriPr from "@/components/ModalBeriPr";

interface Props {
  enrollmentId: string;
  guruId?: string;
  classType: "tahfidz" | "calistung" | "umum";
  studentName: string;
  onNavigateToSection: (sectionKey: string) => void;
}

export default function StudentSummaryCard({
  enrollmentId,
  guruId = "",
  classType,
  studentName,
  onNavigateToSection,
}: Props) {
  const [hafalanList, setHafalanList] = useState<HafalanProgress[]>([]);
  const [murajaahList, setMurajaahList] = useState<MurajaahSession[]>([]);
  const [iqroList, setIqroList] = useState<IqroProgress[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [calistungData, setCalistungData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPetaModal, setShowPetaModal] = useState(false);
  const [showModalBeriPr, setShowModalBeriPr] = useState(false);
  const [petaFilter, setPetaFilter] = useState<"selesai" | "juz30" | "semua">("selesai");

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
        const [hafalan, murajaah, iqro, absRes] = await Promise.all([
          tampilRiwayatHafalan(enrollmentId).catch(() => []),
          tampilRiwayatMurajaah(enrollmentId).catch(() => []),
          tampilRiwayatIqro(enrollmentId).catch(() => []),
          tampilAbsensiMurid(enrollmentId).catch(() => []),
        ]);
        setHafalanList(hafalan);
        setMurajaahList(murajaah);
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
    const handleOpenPr = () => setShowModalBeriPr(true);
    window.addEventListener("refresh-student-summary", handleRefresh);
    window.addEventListener("open-pr-modal", handleOpenPr);
    return () => {
      window.removeEventListener("refresh-student-summary", handleRefresh);
      window.removeEventListener("open-pr-modal", handleOpenPr);
    };
  }, [enrollmentId, classType]);

  // ── KEHADIRAN (Bulan Berjalan & Akumulasi Total) ─────────
  const currentYM = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthAttendances = attendances.filter((a) => a.date && a.date.startsWith(currentYM));
  const isBulanIni = monthAttendances.length > 0;
  const activeAttendances = isBulanIni ? monthAttendances : attendances;
  const hadirCount = activeAttendances.filter((a) => a.status === "H").length;
  const totalSesi = activeAttendances.length;
  const attendanceRate = totalSesi > 0 ? Math.round((hadirCount / totalSesi) * 100) : null;

  // ── KALKULASI TAHFIDZ ──────────────────────────────────────────
  const latestHafalan = hafalanList[0] || null;

  // Cek daftar PR aktif (belum disimak) dari Hafalan & Muroja'ah
  const activePrList = useMemo(() => {
    const hPrs = hafalanList
      .filter((h) => h.is_pr && !h.parent_simak_at)
      .map((h) => ({
        id: h.id,
        type: "hafalan" as const,
        surahName: h.surah_name,
        surahNumber: h.surah_number,
        range: `${h.ayat_reached}/${h.total_ayat} ${h.surah_number === 0 ? "hlm" : "ayat"}`,
        deadline: h.session_date,
        notes: h.pr_notes_guru,
      }));

    const mPrs = murajaahList
      .filter((m) => m.is_pr && !m.parent_simak_at)
      .map((m) => ({
        id: m.id,
        type: "murajaah" as const,
        surahName: m.surah_name,
        surahNumber: m.surah_number,
        range: m.ayat_or_page_range || "",
        deadline: m.session_date,
        notes: m.pr_notes_guru,
      }));

    return [...hPrs, ...mPrs].sort(
      (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
    );
  }, [hafalanList, murajaahList]);

  const latestPr = activePrList[0] || null;

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

  // Pencapaian Makro Juz Terakhir (Juz & Halaman) agar TIDAK TENGGELAM saat diisi setoran surat harian
  const latestJuzRecord = useMemo(() => {
    return (
      hafalanList.find(
        (h) => h.surah_number === 0 || h.surah_name.startsWith("Juz ")
      ) || null
    );
  }, [hafalanList]);

  // Peta status per surat
  const surahProgressMap = useMemo(() => {
    const map = new Map<number, { reached: number; total: number; isLulus: boolean; date?: string }>();

    hafalanList.forEach((item) => {
      if (item.surah_number > 0) {
        const existing = map.get(item.surah_number);
        const itemIsLulus =
          (item.status ?? "lulus") === "lulus" &&
          item.ayat_reached >= item.total_ayat;
        const reached = Math.max(item.ayat_reached, existing?.reached || 0);
        const isLulus = Boolean(existing?.isLulus || itemIsLulus);

        map.set(item.surah_number, {
          reached,
          total: item.total_ayat,
          isLulus,
          date: itemIsLulus ? item.session_date : existing?.date || item.session_date,
        });
      }
    });

    // Jika murid sudah dinyatakan lulus Juz 30 (20/20 halaman), pastikan seluruh surat Juz 30 (78-114) terhitung tuntas
    const isJuz30Lulus =
      latestJuzRecord &&
      latestJuzRecord.surah_name === "Juz 30" &&
      (latestJuzRecord.status ?? "lulus") === "lulus" &&
      latestJuzRecord.ayat_reached >= (latestJuzRecord.total_ayat || 20);

    if (isJuz30Lulus) {
      for (let num = 78; num <= 114; num++) {
        const existing = map.get(num);
        if (!existing || !existing.isLulus) {
          const surahObj = QURAN_SURAHS.find((s) => s.number === num);
          map.set(num, {
            reached: surahObj?.ayat || 1,
            total: surahObj?.ayat || 1,
            isLulus: true,
            date: latestJuzRecord.session_date,
          });
        }
      }
    }

    return map;
  }, [hafalanList, latestJuzRecord]);

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

  // Daftar seluruh surat yang sudah tuntas dihafalkan
  const completedSurahsList = useMemo(() => {
    return QURAN_SURAHS.filter((s) => surahProgressMap.get(s.number)?.isLulus);
  }, [surahProgressMap]);

  const completedSurahsSummary = useMemo(() => {
    if (completedSurahsList.length === 0) return "";
    if (completedSurahsList.length === 37 && juz30Stats.tuntas === 37) {
      return "An-Nas s.d. An-Naba'";
    }
    const first = completedSurahsList[0]?.name;
    const last = completedSurahsList[completedSurahsList.length - 1]?.name;
    return first === last ? first : `${first} s.d. ${last}`;
  }, [completedSurahsList, juz30Stats]);

  // Data Makro Capaian Juz & Halaman
  const macroData = useMemo(() => {
    if (latestJuzRecord) {
      const isLulus =
        (latestJuzRecord.status ?? "lulus") === "lulus" &&
        latestJuzRecord.ayat_reached >= (latestJuzRecord.total_ayat || 20);
      const totalHalaman = latestJuzRecord.total_ayat || 20;
      const halamanTuntas = latestJuzRecord.ayat_reached;
      const percent = Math.min(
        100,
        Math.round((halamanTuntas / totalHalaman) * 100)
      );
      return {
        title: latestJuzRecord.surah_name,
        subtitle: `${halamanTuntas}/${totalHalaman} Halaman`,
        halamanTuntas,
        totalHalaman,
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
    const totalHalaman = 20;
    const halamanTuntas = Math.round((juz30Stats.tuntas / 37) * 20);
    const percent = Math.min(100, Math.round((juz30Stats.tuntas / 37) * 100));
    return {
      title: "Juz 30",
      subtitle: `${halamanTuntas}/${totalHalaman} Halaman`,
      halamanTuntas,
      totalHalaman,
      percent,
      isLulus,
      statusLabel: isLulus ? "Lulus" : "Berprogres",
      date: null,
    };
  }, [latestJuzRecord, juz30Stats]);

  // Level Murid berdasarkan akumulasi juz yang sudah tuntas
  const studentLevel = useMemo(() => {
    const completedJuzCount = hafalanList.filter(
      (h) =>
        (h.surah_number === 0 || h.surah_name.startsWith("Juz ")) &&
        (h.status ?? "lulus") === "lulus" &&
        h.ayat_reached >= (h.total_ayat || 20)
    ).length;
    const effectiveJuzCount = Math.max(completedJuzCount, juz30Stats.tuntas >= 37 ? 1 : 0);

    if (effectiveJuzCount >= 10) return { label: "Level 5 (Mutqin)", color: "bg-purple-100 text-purple-800 border-purple-200" };
    if (effectiveJuzCount >= 6) return { label: "Level 4 (Utama)", color: "bg-blue-100 text-blue-800 border-blue-200" };
    if (effectiveJuzCount >= 4) return { label: "Level 3 (Madya)", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
    if (effectiveJuzCount >= 2) return { label: "Level 2 (Pratama)", color: "bg-cyan-100 text-cyan-800 border-cyan-200" };
    if (effectiveJuzCount === 1) return { label: "Level 1 (Juz 'Amma)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    return { label: "Level 1 (Juz 'Amma)", color: "bg-emerald-50 text-emerald-800 border-emerald-200/60" };
  }, [hafalanList, juz30Stats]);

  // Evaluasi jika mencapai batas kelipatan halaman atau tuntas juz (pengganti milestone)
  const thresholdEvaluation = useMemo(() => {
    if (!latestHafalan) return null;
    if (latestJuzRecord) {
      const reached = latestJuzRecord.ayat_reached;
      const total = latestJuzRecord.total_ayat || 20;
      if (reached >= total) {
        return {
          title: `Tuntas ${latestJuzRecord.surah_name}!`,
          desc: `Ananda telah menyelesaikan ${reached}/${total} halaman. Siap untuk Ujian Kenaikan Juz.`,
          buttonText: "Ujian Kenaikan Juz",
        };
      }
      if (reached > 0 && reached % 5 === 0) {
        return {
          title: `Batas Kelipatan Tercapai (${reached} Hlm)`,
          desc: `Target kelipatan ${reached} halaman ${latestJuzRecord.surah_name} tercapai. Siap untuk Uji Tasmi'.`,
          buttonText: `Uji Tasmi' ${reached} Hlm`,
        };
      }
    } else if (juz30Stats.tuntas >= 37) {
      return {
        title: "Tuntas Juz 30 (37 Surat)!",
        desc: "Seluruh 37 surat Juz 30 telah tuntas. Siap untuk Ujian Tasmi' Juz 30.",
        buttonText: "Ujian Tasmi' Juz 30",
      };
    }
    return null;
  }, [latestHafalan, latestJuzRecord, juz30Stats]);

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
    if (attendanceRate === null || totalSesi === 0) return null;
    const isRendah = attendanceRate < 70;
    const labelPeriode = isBulanIni ? "Bulan Ini" : "Total";
    return (
      <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
        <span>
          Kehadiran ({labelPeriode}):{" "}
          <strong className={isRendah ? "text-amber-700" : "text-slate-900"}>
            {hadirCount}×
          </strong>{" "}
          dari {totalSesi} sesi
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rangkuman Capaian
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${studentLevel.color}`}>
              {studentLevel.label}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            Tahfidz Al-Qur'an
          </span>
        </div>

        {latestHafalan ? (
          <div className="space-y-3">
            {/* ── 1. Posisi Pencapaian Makro: Juz & Halaman (Tampilan Persis Sesuai Kartu Acuan Guru) ── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {macroData.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        macroData.isLulus
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {macroData.isLulus ? "✅ Lulus" : "🔄 Sedang Ditempuh"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {macroData.date || "Capaian Kumulatif"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-blue-600 tracking-tight">
                    {macroData.halamanTuntas}/{macroData.totalHalaman}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 block -mt-0.5">
                    Halaman
                  </span>
                </div>
              </div>

              {/* Progress Bar Makro */}
              <div className="space-y-1">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      macroData.isLulus ? "bg-emerald-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${macroData.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                  <span>Progres Total Juz</span>
                  <span className="font-bold text-slate-700">{macroData.percent}%</span>
                </div>
              </div>

              {/* Akses Cepat Surat Tuntas */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                  <span className="shrink-0">📖 Surat Tuntas:</span>
                  <strong className="text-emerald-700 font-bold shrink-0">
                    {completedSurahsList.length} Surat
                  </strong>
                  {completedSurahsSummary && (
                    <span className="text-slate-400 truncate text-[11px] hidden sm:inline">
                      ({completedSurahsSummary})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPetaFilter("selesai");
                    setShowPetaModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-0.5 shrink-0 ml-2 hover:underline"
                >
                  Peta Surat <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* ── 2. Sesi Terakhir Murid (Ringkas / Subdued agar fokus tetap di capaian Juz) ── */}
            <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Sesi Terakhir:
                  </span>
                  <strong className="text-slate-800 font-bold truncate">
                    {latestHafalan.surah_name}
                  </strong>
                  <span className="text-slate-500 font-medium shrink-0">
                    ({latestHafalan.ayat_reached}/{latestHafalan.total_ayat}{" "}
                    {latestHafalan.surah_number === 0 ? "hlm" : "ayat"})
                  </span>
                </div>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md text-[10px] border shrink-0 ${
                    isLatestLulus
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isLatestLulus
                    ? "Lulus"
                    : ngulangCount > 1
                    ? `Ngulang (${ngulangCount}×)`
                    : "Ngulang"}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  Tanggal:{" "}
                  {new Date(latestHafalan.session_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {latestHafalan.notes && (
                  <span className="italic text-slate-500 truncate max-w-[200px]">
                    "{latestHafalan.notes}"
                  </span>
                )}
              </div>
            </div>

            {/* ── 3. Tugas Rumah (PR) & Penugasan Weekend ── */}
            {activePrList.length > 0 ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏠</span>
                    <span className="text-xs font-bold text-amber-950">
                      Tugas Rumah Aktif ({activePrList.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModalBeriPr(true)}
                    className="text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl transition"
                  >
                    + Buat PR Baru
                  </button>
                </div>

                <div className="space-y-2">
                  {activePrList.slice(0, 2).map((pr) => (
                    <div
                      key={`${pr.type}-${pr.id}`}
                      className="bg-white/90 p-2.5 rounded-xl border border-amber-200/70 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-bold truncate">
                            {pr.surahName}
                          </strong>
                          <span className="text-slate-500 font-medium shrink-0">
                            ({pr.range})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                          <span>
                            Batas:{" "}
                            {new Date(pr.deadline).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          {pr.notes && (
                            <span className="italic text-amber-800 truncate max-w-[180px]">
                              "{pr.notes}"
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Belum Disimak
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Hapus/batalkan tugas PR ${pr.surahName}?`)) {
                              if (pr.type === "murajaah") await hapusMurajaah(pr.id);
                              else await hapusHafalan(pr.id);
                              loadData();
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Batalkan PR ini"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 text-xs text-slate-600">
                  <span className="text-lg shrink-0">🏠</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      Belum Ada PR Pekan Ini
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Tugaskan capaian pekanan atau PR Weekend
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModalBeriPr(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 whitespace-nowrap flex items-center gap-1"
                >
                  <span>+ Beri PR Weekend</span>
                </button>
              </div>
            )}

            {/* ── 4. Notifikasi Batas Tercapai & Evaluasi (Eks-Milestone) ── */}
            {thresholdEvaluation && (
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">🎓</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-950 truncate">
                      {thresholdEvaluation.title}
                    </p>
                    <p className="text-[10px] text-amber-800 line-clamp-1">
                      {thresholdEvaluation.desc}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartTeachingHafalan()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0 whitespace-nowrap"
                >
                  {thresholdEvaluation.buttonText}
                </button>
              </div>
            )}

            {/* ── 5. Kehadiran Murid ── */}
            <AttendanceRow />

            {/* ── 6. Tombol utama ── */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleStartTeachingHafalan()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
              >
                Input Sesi Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setShowModalBeriPr(true)}
                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1"
                title="Beri Tugas Rumah (PR)"
              >
                <span>🏠 Beri PR</span>
              </button>
            </div>
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
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 flex-wrap">
                {[
                  { label: `Surat Selesai (${completedSurahsList.length})`, val: "selesai" as const },
                  { label: `Juz 30 (${juz30Stats.tuntas}/37)`, val: "juz30" as const },
                  { label: "Semua Surat (114)", val: "semua" as const },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPetaFilter(val)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      petaFilter === val
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
              {petaFilter === "selesai" && completedSurahsList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada surat yang dinyatakan tuntas. Silakan pilih tab <strong>Juz 30</strong> untuk mulai setoran.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QURAN_SURAHS.filter((s) => {
                    if (petaFilter === "selesai") return surahProgressMap.get(s.number)?.isLulus;
                    if (petaFilter === "juz30") return s.number >= 78;
                    return true;
                  }).map((surah) => {
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
              )}
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

      {/* ── MODAL BERI PR / TUGAS RUMAH ─────────────────── */}
      <ModalBeriPr
        isOpen={showModalBeriPr}
        onClose={() => setShowModalBeriPr(false)}
        enrollmentId={enrollmentId}
        guruId={guruId}
        studentName={studentName}
        hafalanList={hafalanList}
        murajaahList={murajaahList}
        onSuccess={() => {
          loadData();
          window.dispatchEvent(new CustomEvent("refresh-student-summary"));
        }}
      />
    </>
  );
}
