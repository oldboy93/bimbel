"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, BookOpen, ChevronLeft, ChevronRight, Loader2, Search, Play, Pause, Volume2, Square } from "lucide-react";
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

// Daftar 3 Qari Pilihan
export const QURAN_RECITERS = [
  { id: "Hudhaify_128kbps", name: "Ali Al-Hudhaify (Tartil Jelas)" },
  // { id: "Alafasy_128kbps", name: "Misyari Rasyid Al-Afasy" },
  // { id: "Husary_128kbps", name: "Mahmud Khalil Al-Husary (Tajwid)" },
];

function getAyahAudioUrl(verseKey: string, reciter: string = "Hudhaify_128kbps"): string {
  const [sStr, aStr] = verseKey.split(":");
  const sPad = String(sStr).padStart(3, "0");
  const aPad = String(aStr).padStart(3, "0");
  return `https://everyayah.com/data/${reciter}/${sPad}${aPad}.mp3`;
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
  const [scriptType, setScriptType] = useState<"imlaei" | "uthmani">("uthmani");
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [selectedReciter, setSelectedReciter] = useState<string>("Hudhaify_128kbps");
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [isAutoPlayNext, setIsAutoPlayNext] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio on close or unmount
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setPlayingVerseKey(null);
      setIsAutoPlayNext(false);
    }
  }, [isOpen]);

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
    // Stop audio on change
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingVerseKey(null);
    setIsAutoPlayNext(false);

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

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingVerseKey(null);
    setIsAutoPlayNext(false);
  };

  const playVerse = (verseKey: string, autoNext: boolean = false) => {
    if (playingVerseKey === verseKey && !autoNext) {
      stopAudio();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = getAyahAudioUrl(verseKey, selectedReciter);
    setPlayingVerseKey(verseKey);
    setIsAutoPlayNext(autoNext);

    audio.onended = () => {
      if (autoNext) {
        const currentIdx = verses.findIndex((v) => v.verse_key === verseKey);
        if (currentIdx !== -1 && currentIdx + 1 < verses.length) {
          const nextVerse = verses[currentIdx + 1];
          playVerse(nextVerse.verse_key, true);
          return;
        }
      }
      setPlayingVerseKey(null);
      setIsAutoPlayNext(false);
    };

    audio.onerror = () => {
      setPlayingVerseKey(null);
      setIsAutoPlayNext(false);
    };

    audio.play().catch((err) => {
      console.warn("Audio play prevented:", err);
      setPlayingVerseKey(null);
    });
  };

  const handleToggleSequence = () => {
    if (playingVerseKey && isAutoPlayNext) {
      stopAudio();
      return;
    }
    let startIndex = 0;
    if (highlightFrom !== undefined && mode === "surat") {
      const foundIdx = verses.findIndex((v) => {
        const [, a] = v.verse_key.split(":");
        return parseInt(a, 10) === highlightFrom;
      });
      if (foundIdx !== -1) startIndex = foundIdx;
    }

    if (verses[startIndex]) {
      playVerse(verses[startIndex].verse_key, true);
    }
  };

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
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${mode === m
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
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${scriptType === "imlaei"
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
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${scriptType === "uthmani"
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
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${fontSize === s
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

          {/* Audio Murottal Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleToggleSequence}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${playingVerseKey && isAutoPlayNext
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
              >
                {playingVerseKey && isAutoPlayNext ? (
                  <>
                    <Square size={12} fill="currentColor" /> Hentikan
                  </>
                ) : (
                  <>
                    <Volume2 size={13} /> Putar Surat
                  </>
                )}
              </button>

              {/* Pilihan Qari */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">Qari:</span>
                <select
                  value={selectedReciter}
                  onChange={(e) => {
                    stopAudio();
                    setSelectedReciter(e.target.value);
                  }}
                  className="text-xs bg-white text-slate-800 font-semibold px-2 py-0.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {QURAN_RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {playingVerseKey ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ayat {playingVerseKey}
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">
                Bisa putar per-ayat atau otomatis
              </span>
            )}
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
                const isPlayingThis = playingVerseKey === verse.verse_key;

                const arabicText =
                  scriptType === "imlaei"
                    ? verse.text_imlaei || verse.text_uthmani
                    : verse.text_uthmani || verse.text_imlaei;

                return (
                  <div
                    key={verse.id}
                    className={`rounded-2xl p-4 transition ${isPlayingThis
                      ? "bg-emerald-50 border-2 border-emerald-400 shadow-sm"
                      : isHighlighted
                        ? "bg-amber-50 border-2 border-amber-300 shadow-sm"
                        : "bg-slate-50 border border-slate-100"
                      }`}
                  >
                    {/* Nomor ayat & Audio Button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-extrabold ${isPlayingThis
                            ? "bg-emerald-600 text-white"
                            : isHighlighted
                              ? "bg-amber-500 text-white"
                              : "bg-white border border-slate-200 text-slate-500 shadow-xs"
                            }`}
                        >
                          {ayatNum}
                        </span>
                        <button
                          type="button"
                          onClick={() => playVerse(verse.verse_key)}
                          className={`px-2 py-1 rounded-lg border transition text-[11px] flex items-center gap-1 font-bold ${isPlayingThis
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                            }`}
                          title={`Dengarkan bacaan qari ayat ${ayatNum}`}
                        >
                          {isPlayingThis ? (
                            <Pause size={11} fill="currentColor" />
                          ) : (
                            <Play size={11} fill="currentColor" />
                          )}
                          <span>Audio</span>
                        </button>
                      </div>
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
