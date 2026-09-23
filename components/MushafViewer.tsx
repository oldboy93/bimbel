"use client";

import { useState, useEffect, useCallback } from "react";
import { X, BookOpen, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import {
  getVersesBySurah,
  getVersesByJuz,
  type QuranVerse,
} from "@/lib/quranService";
import { QURAN_SURAHS } from "@/lib/quranData";
import { QURAN_JUZS } from "@/lib/quranJuz";

interface MushafViewerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Konteks awal: pre-fill berdasarkan form setoran yang aktif */
  initialMode?: "surat" | "juz";
  initialSurahNumber?: number;
  initialJuzNumber?: number;
  /** Range ayat highlight (hanya surat mode) */
  highlightFrom?: number;
  highlightTo?: number;
}

export default function MushafViewer({
  isOpen,
  onClose,
  initialMode = "surat",
  initialSurahNumber = 1,
  initialJuzNumber = 1,
  highlightFrom,
  highlightTo,
}: MushafViewerProps) {
  const [mode, setMode] = useState<"surat" | "juz">(initialMode);
  const [surahNum, setSurahNum] = useState(initialSurahNumber);
  const [juzNum, setJuzNum] = useState(initialJuzNumber);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("lg");
  const [scriptType, setScriptType] = useState<"imlaei" | "uthmani">("imlaei");
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync prop changes ke state (saat form setoran berubah)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSurahNum(initialSurahNumber);
      setJuzNum(initialJuzNumber);
    }
  }, [isOpen, initialMode, initialSurahNumber, initialJuzNumber]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setVerses([]);
    try {
      let result: QuranVerse[] = [];
      if (mode === "surat") {
        result = await getVersesBySurah(surahNum);
      } else {
        result = await getVersesByJuz(juzNum);
      }
      setVerses(result);
    } catch {
      setError("Gagal memuat ayat. Periksa koneksi internet.");
    } finally {
      setIsLoading(false);
    }
  }, [mode, surahNum, juzNum]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const fontSizeClass = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[fontSize];

  const fontSizeTranslClass = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-xs",
    xl: "text-sm",
  }[fontSize];

  const surahName = QURAN_SURAHS.find((s) => s.number === surahNum)?.name ?? "";

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[998] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] bg-white z-[999] flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
        style={{ maxHeight: "92dvh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <BookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">Lihat Mushaf</h2>
              <p className="text-[10px] text-slate-400 font-medium">
                {mode === "surat" ? `Q.S. ${surahName}` : `Juz ${juzNum}`}
                {highlightFrom && highlightTo
                  ? ` · Ayat ${highlightFrom}–${highlightTo}`
                  : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Controls ── */}
        <div className="px-4 py-3 border-b border-slate-100 space-y-3 shrink-0">
          {/* Mode Toggle */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(["surat", "juz"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  mode === m
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "surat" ? "Per Surat" : "Per Juz"}
              </button>
            ))}
          </div>

          {/* Selector */}
          {mode === "surat" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSurahNum((n) => Math.max(1, n - 1))}
                disabled={surahNum === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <select
                value={surahNum}
                onChange={(e) => setSurahNum(+e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-slate-800"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.ayat} ayat)
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSurahNum((n) => Math.min(114, n + 1))}
                disabled={surahNum === 114}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJuzNum((n) => Math.max(1, n - 1))}
                disabled={juzNum === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <select
                value={juzNum}
                onChange={(e) => setJuzNum(+e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-slate-800"
              >
                {QURAN_JUZS.map((j) => (
                  <option key={j.number} value={j.number}>
                    Juz {j.number} — {j.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setJuzNum((n) => Math.min(30, n + 1))}
                disabled={juzNum === 30}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Font Controls & Rasm */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            {/* Rasm Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Rasm:</span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setScriptType("imlaei")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                    scriptType === "imlaei"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Mushaf Standar Indonesia / Kemenag RI (100% kompatibel di semua HP)"
                >
                  Standar (Kemenag)
                </button>
                <button
                  type="button"
                  onClick={() => setScriptType("uthmani")}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                    scriptType === "uthmani"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Mushaf Rasm Utsmani (Madinah)"
                >
                  Utsmani
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Ukuran:</span>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                {(["sm", "md", "lg", "xl"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFontSize(s)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                      fontSize === s
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>

              {highlightFrom && highlightTo && mode === "surat" && (
                <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-bold whitespace-nowrap">
                  🎯 {highlightFrom}–{highlightTo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Ayat Content ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-emerald-600 h-8 w-8" />
              <p className="text-sm text-slate-400">Memuat ayat Al-Qur&#39;an...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Search size={32} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">{error}</p>
              <button
                onClick={load}
                className="text-xs text-emerald-600 font-bold underline"
              >
                Coba lagi
              </button>
            </div>
          ) : verses.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Tidak ada ayat ditemukan.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basmalah (kecuali At-Taubah surat 9) */}
              {mode === "surat" && surahNum !== 9 && surahNum !== 1 && (
                <p
                  className="text-center text-emerald-800 text-3xl font-quran py-2"
                  style={{
                    fontFamily: "var(--font-quran), 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif",
                    lineHeight: "2.6",
                  }}
                  dir="rtl"
                >
                  {scriptType === "imlaei"
                    ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
                    : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}
                </p>
              )}

              {verses.map((verse) => {
                const [, ayatStr] = verse.verse_key.split(":");
                const ayatNum = parseInt(ayatStr, 10);
                const isHighlighted =
                  mode === "surat" &&
                  highlightFrom !== undefined &&
                  highlightTo !== undefined &&
                  ayatNum >= highlightFrom &&
                  ayatNum <= highlightTo;

                const arabicText =
                  scriptType === "imlaei"
                    ? verse.text_imlaei || verse.text_uthmani
                    : verse.text_uthmani || verse.text_imlaei;

                return (
                  <div
                    key={verse.id}
                    className={`rounded-2xl p-4 transition ${
                      isHighlighted
                        ? "bg-amber-50 border-2 border-amber-300 shadow-sm"
                        : "bg-slate-50 border border-slate-100"
                    }`}
                  >
                    {/* Nomor ayat */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-extrabold ${
                          isHighlighted
                            ? "bg-amber-500 text-white"
                            : "bg-white border border-slate-200 text-slate-500 shadow-xs"
                        }`}
                      >
                        {ayatNum}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {verse.verse_key}
                      </span>
                    </div>

                    {/* Teks Arab Berharakat Lengkap */}
                    <p
                      dir="rtl"
                      className={`${fontSizeClass} font-quran text-slate-900 text-right mb-3 select-text`}
                      style={{
                        fontFamily: "var(--font-quran), 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif",
                        lineHeight: "2.6",
                      }}
                    >
                      {arabicText}
                    </p>

                    {/* Terjemahan */}
                    {verse.translations?.[0] && (
                      <p className={`${fontSizeTranslClass} text-slate-500 leading-relaxed border-t border-slate-200 pt-2 mt-1`}>
                        {verse.translations[0].text.replace(/<[^>]+>/g, "")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          <p className="text-[10px] text-slate-400 text-center">
            Data Al-Qur&#39;an dari{" "}
            <span className="font-bold text-emerald-600">quran.com</span> · Terjemahan Kemenag RI
          </p>
        </div>
      </div>
    </>
  );
}
