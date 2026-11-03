"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Sparkles, Calendar, BookOpen, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { QURAN_SURAHS, getSurahByNumber } from "@/lib/quranData";
import { QURAN_JUZS } from "@/lib/quranJuz";
import { simpanPrHafalan } from "@/services/hafalanService";
import { simpanPrMurajaah } from "@/services/murajaahService";
import type { HafalanProgress, MurajaahSession } from "@/types";

interface ModalBeriPrProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  guruId: string;
  studentName: string;
  hafalanList: HafalanProgress[];
  murajaahList?: MurajaahSession[];
  onSuccess: () => void;
}

export default function ModalBeriPr({
  isOpen,
  onClose,
  enrollmentId,
  guruId,
  studentName,
  hafalanList,
  murajaahList = [],
  onSuccess,
}: ModalBeriPrProps) {
  const [activeTab, setActiveTab] = useState<"pekanan" | "kustom">("pekanan");

  // State Form Kustom
  const [kategori, setKategori] = useState<"murajaah" | "hafalan">("murajaah");
  const [targetMode, setTargetMode] = useState<"surat" | "juz">("surat");
  const [surahNum, setSurahNum] = useState<number>(78);
  const [juzNum, setJuzNum] = useState<number>(30);
  const [ayatFrom, setAyatFrom] = useState<number>(1);
  const [ayatTo, setAyatTo] = useState<number>(10);
  const [customRangeText, setCustomRangeText] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [prNotes, setPrNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ── 1. HITUNG TENGGAT WAKTU DEFAULT (Ahad / Akhir Pekan Terdekat) ──
  const upcomingSundayStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const daysUntilSunday = (7 - day) % 7;
    const sunday = new Date(d);
    sunday.setDate(d.getDate() + (daysUntilSunday === 0 ? 0 : daysUntilSunday));
    return sunday.toISOString().split("T")[0];
  }, []);

  const nextSundayStr = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilSunday = ((7 - day) % 7) + 7;
    const sunday = new Date(d);
    sunday.setDate(d.getDate() + daysUntilSunday);
    return sunday.toISOString().split("T")[0];
  }, []);

  // ── 2. DETEKSI CAPAIAN PEKAN INI (Senin s.d. Hari Ini) ──
  const weeklyAchievement = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split("T")[0];

    // Ambil sesi hafalan kelas (bukan PR) selama pekan ini
    const thisWeekClassSessions = hafalanList.filter(
      (h) => !h.is_pr && h.session_date >= mondayStr
    );

    if (thisWeekClassSessions.length > 0) {
      // Ambil sesi terbaru pekan ini
      const latestThisWeek = thisWeekClassSessions[0];
      const sameSurahSessions = thisWeekClassSessions.filter(
        (s) => s.surah_number === latestThisWeek.surah_number
      );
      const maxReached = Math.max(
        ...sameSurahSessions.map((s) => s.ayat_reached),
        latestThisWeek.ayat_reached
      );

      return {
        isFoundThisWeek: true,
        sessionCount: thisWeekClassSessions.length,
        surahNumber: latestThisWeek.surah_number,
        surahName: latestThisWeek.surah_name,
        totalAyat: latestThisWeek.total_ayat,
        maxReached,
        rangeLabel: `Ayat 1 - ${maxReached}`,
        suggestedNotes: `[PR Weekend] Capaian pekan ini: Mohon disimak lancar ayat 1 s.d. ${maxReached} saat akhir pekan.`,
      };
    }

    // Jika belum ada sesi kelas pekan ini, fallback ke sesi terakhir murid
    const nonPrList = hafalanList.filter((h) => !h.is_pr);
    if (nonPrList.length > 0) {
      const last = nonPrList[0];
      return {
        isFoundThisWeek: false,
        sessionCount: 0,
        surahNumber: last.surah_number,
        surahName: last.surah_name,
        totalAyat: last.total_ayat,
        maxReached: last.ayat_reached,
        rangeLabel: `Ayat 1 - ${last.ayat_reached}`,
        suggestedNotes: `[PR Weekend] Mohon disimak kembali hafalan ${last.surah_name} ayat 1 s.d. ${last.ayat_reached} di rumah.`,
      };
    }

    return null;
  }, [hafalanList]);

  // Inisialisasi awal saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setDeadlineDate(upcomingSundayStr);
      setErrorMsg("");

      if (weeklyAchievement) {
        setSurahNum(weeklyAchievement.surahNumber > 0 ? weeklyAchievement.surahNumber : 78);
        setAyatFrom(1);
        setAyatTo(weeklyAchievement.maxReached || 10);
        setPrNotes(weeklyAchievement.suggestedNotes);
        setCustomRangeText(weeklyAchievement.rangeLabel);
      } else {
        setSurahNum(78);
        const s78 = getSurahByNumber(78);
        setAyatFrom(1);
        setAyatTo(s78?.ayat || 40);
        setCustomRangeText(`Ayat 1 - ${s78?.ayat || 40}`);
        setPrNotes("[PR Weekend] Mohon ananda disimak hafalan akhir pekannya bersama orang tua.");
      }
    }
  }, [isOpen, upcomingSundayStr, weeklyAchievement]);

  if (!isOpen) return null;

  const currentSurahObj = getSurahByNumber(surahNum);
  const currentTotalAyat = currentSurahObj?.ayat || 1;

  // ── SUBMIT PR PEKANAN OTOMATIS (1-KLIK) ──
  const handleAssignWeeklyPr = async () => {
    if (!weeklyAchievement) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await simpanPrMurajaah({
        enrollmentId,
        guruId,
        hafalanType: weeklyAchievement.surahNumber === 0 ? "juz" : "surat",
        surahNumber: weeklyAchievement.surahNumber,
        surahName: weeklyAchievement.surahName,
        ayatOrPageRange: weeklyAchievement.rangeLabel,
        sessionDate: deadlineDate || upcomingSundayStr,
        prNotesGuru: prNotes || weeklyAchievement.suggestedNotes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menugaskan PR Weekend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SUBMIT PR KUSTOM ──
  const handleAssignCustomPr = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const finalSurahName =
        targetMode === "surat" ? currentSurahObj?.name || `Surat ke-${surahNum}` : `Juz ${juzNum}`;
      const finalRange =
        customRangeText.trim() ||
        (targetMode === "surat" ? `Ayat ${ayatFrom} - ${ayatTo}` : `Halaman 1 - 20`);

      if (kategori === "murajaah") {
        await simpanPrMurajaah({
          enrollmentId,
          guruId,
          hafalanType: targetMode,
          surahNumber: targetMode === "surat" ? surahNum : 0,
          surahName: finalSurahName,
          ayatOrPageRange: finalRange,
          sessionDate: deadlineDate || upcomingSundayStr,
          prNotesGuru: prNotes.trim() || "[Target Penugasan] Mohon disimak oleh orang tua di rumah.",
        });
      } else {
        await simpanPrHafalan({
          enrollmentId,
          guruId,
          surahNumber: targetMode === "surat" ? surahNum : 0,
          surahName: finalSurahName,
          totalAyat: currentTotalAyat,
          ayatReached: ayatTo,
          sessionDate: deadlineDate || upcomingSundayStr,
          prNotesGuru: prNotes.trim() || "[PR Hafalan Baru] Mohon disimak oleh orang tua di rumah.",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan tugas PR.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 shrink-0">
              🏠
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Tugaskan PR untuk Disimak di Rumah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Murid: <strong className="text-slate-800">{studentName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-1 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab("pekanan")}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "pekanan"
                  ? "bg-white text-amber-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles size={14} className={activeTab === "pekanan" ? "text-amber-600" : ""} />
              <span>⚡ Capaian Pekan Ini</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kustom")}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "kustom"
                  ? "bg-white text-blue-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen size={14} className={activeTab === "kustom" ? "text-blue-600" : ""} />
              <span>✏️ Set Kustom Sendiri</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* ═══════════ TAB 1: CAPAIAN PEKAN INI (1-KLIK) ═══════════ */}
          {activeTab === "pekanan" && (
            <div className="space-y-4">
              {weeklyAchievement ? (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      <Sparkles size={12} />
                      {weeklyAchievement.isFoundThisWeek
                        ? `${weeklyAchievement.sessionCount} Sesi Pekan Ini Terdeteksi`
                        : "Berdasarkan Sesi Terakhir"}
                    </span>
                    <span className="text-[11px] text-amber-800 font-bold">
                      Target: {weeklyAchievement.rangeLabel}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900">
                      {weeklyAchievement.surahName}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Target akumulasi: Ayat 1 s.d. {weeklyAchievement.maxReached} (dari{" "}
                      {weeklyAchievement.totalAyat} ayat)
                    </p>
                  </div>

                  {/* Tenggat Waktu */}
                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Calendar size={13} className="text-amber-700" />
                      Batas Simakan:
                    </span>
                    <strong className="text-slate-900 font-bold">
                      Ahad,{" "}
                      {new Date(deadlineDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  Belum ada riwayat sesi yang dapat dijadikan rujukan. Silakan gunakan tab{" "}
                  <strong>Set Kustom Sendiri</strong> untuk membuat PR perdana.
                </div>
              )}

              {/* Tanggal & Pesan untuk Ortu */}
              {weeklyAchievement && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batas Waktu Simakan (Tenggat)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setDeadlineDate(upcomingSundayStr)}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition"
                      >
                        Ahad Ini
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlineDate(nextSundayStr)}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      >
                        Ahad Depan
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pesan / Instruksi Guru untuk Orang Tua
                    </label>
                    <textarea
                      value={prNotes}
                      onChange={(e) => setPrNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignWeeklyPr}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Tugaskan Sebagai PR Weekend</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: SET KUSTOM SENDIRI ═══════════ */}
          {activeTab === "kustom" && (
            <form onSubmit={handleAssignCustomPr} className="space-y-4">
              {/* Kategori PR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Tugas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKategori("murajaah")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      kategori === "murajaah"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    🔄 Muroja'ah (Pengulangan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setKategori("hafalan")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                      kategori === "hafalan"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    📖 Hafalan Baru (Ziyadah)
                  </button>
                </div>
              </div>

              {/* Mode Target (Surat vs Juz) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetMode("surat")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    targetMode === "surat"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Berdasarkan Surat
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("juz")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    targetMode === "juz"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  Berdasarkan Juz
                </button>
              </div>

              {/* Pilihan Surat / Juz */}
              {targetMode === "surat" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Surat</label>
                  <select
                    value={surahNum}
                    onChange={(e) => {
                      const num = +e.target.value;
                      setSurahNum(num);
                      const s = getSurahByNumber(num);
                      setAyatFrom(1);
                      setAyatTo(s?.ayat || 1);
                      setCustomRangeText(`Ayat 1 - ${s?.ayat || 1}`);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {QURAN_SURAHS.map((s) => (
                      <option key={s.number} value={s.number}>
                        #{s.number} {s.name} ({s.ayat} ayat)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Juz</label>
                  <select
                    value={juzNum}
                    onChange={(e) => {
                      const num = +e.target.value;
                      setJuzNum(num);
                      setCustomRangeText(`Halaman 1 - 20 (Juz ${num})`);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {QURAN_JUZS.map((j) => (
                      <option key={j.number} value={j.number}>
                        {j.name} ({j.halaman} halaman)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Range Target */}
              {targetMode === "surat" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rentang Ayat Target
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400">Dari Ayat:</span>
                      <input
                        type="number"
                        min={1}
                        max={currentTotalAyat}
                        value={ayatFrom}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(currentTotalAyat, +e.target.value));
                          setAyatFrom(val);
                          setCustomRangeText(`Ayat ${val} - ${ayatTo}`);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Sampai Ayat:</span>
                      <input
                        type="number"
                        min={1}
                        max={currentTotalAyat}
                        value={ayatTo}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(currentTotalAyat, +e.target.value));
                          setAyatTo(val);
                          setCustomRangeText(`Ayat ${ayatFrom} - ${val}`);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setAyatFrom(1);
                        setAyatTo(currentTotalAyat);
                        setCustomRangeText(`Ayat 1 - ${currentTotalAyat}`);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    >
                      Semua Ayat (1 - {currentTotalAyat})
                    </button>
                    {currentTotalAyat > 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAyatFrom(1);
                          setAyatTo(10);
                          setCustomRangeText(`Ayat 1 - 10`);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                      >
                        10 Ayat Pertama
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Batas Waktu / Tenggat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Waktu Simakan (Tenggat)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setDeadlineDate(upcomingSundayStr)}
                    className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition"
                  >
                    Ahad Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeadlineDate(nextSundayStr)}
                    className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  >
                    Ahad Depan
                  </button>
                </div>
              </div>

              {/* Pesan Guru & Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pesan / Instruksi untuk Orang Tua
                  </label>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {[
                    { label: "+ PR Weekend", text: "[PR Weekend] Mohon ananda disimak hafalan akhir pekannya bersama orang tua." },
                    { label: "+ Target Pekanan", text: "[Target Pekanan] Mohon disimak berkala selama 1 pekan ini." },
                    { label: "+ Uji Tasmi'", text: "[Persiapan Uji Tasmi'] Mohon disimak kelancaran & tajwidnya sebelum ujian." },
                    { label: "+ Latihan Mad", text: "[Perbaikan Tajwid] Perhatikan hukum mad dan makhraj huruf ananda." },
                  ].map(({ label, text }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setPrNotes(text)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] font-semibold transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  placeholder="Instruksi simakan untuk orang tua..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Simpan &amp; Tugaskan PR</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

