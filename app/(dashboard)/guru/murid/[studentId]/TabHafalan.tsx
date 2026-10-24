"use client";
import { useEffect, useState } from "react";
import { tampilRiwayatHafalan, simpanHafalan, hitungPersenHafalan } from "@/services/hafalanService";
import { simpanAssessmentTajwid } from "@/services/gradeService";
import type { HafalanProgress } from "@/types";
import { QURAN_SURAHS, getSurahByNumber } from "@/lib/quranData";
import { QURAN_JUZS, getHalamanByJuz, getJuzPageRange } from "@/lib/quranJuz";
import { getProgressColor, TAJWID_LEVELS } from "@/lib/helpers";
import { Loader2, BookOpen, Plus, Trash2, Trophy, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MushafViewer from "@/components/MushafViewer";

interface Props {
  enrollmentId: string;
  guruId: string;
  studentPhone?: string;
  studentName?: string;
}

export default function TabHafalan({ enrollmentId, guruId, studentPhone, studentName }: Props) {
  const [riwayat, setRiwayat] = useState<HafalanProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<HafalanProgress | null>(null);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 2;

  // Form state
  const [mode, setMode] = useState<'surat' | 'juz'>('juz');
  const [surahNum, setSurahNum] = useState(1);
  const [juzNum, setJuzNum] = useState(1);
  const [ayatReached, setAyatReached] = useState(0);
  const [pageReached, setPageReached] = useState(0);
  const [examPages, setExamPages] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [juzKelipatan, setJuzKelipatan] = useState<3 | 5>(3);
  const [status, setStatus] = useState<'lulus' | 'ngulang'>('lulus');
  const [isPr, setIsPr] = useState(false);
  const [prNotesGuru, setPrNotesGuru] = useState("");

  // ── Mushaf Viewer state ──
  const [showMushaf, setShowMushaf] = useState(false);

  // ── Quick Tajwid state (opsional) ──
  type TajwidLevel = 'mulai' | 'sedang' | 'lancar';
  const [enableTajwid, setEnableTajwid] = useState(false);
  const [tajwidMakhraj, setTajwidMakhraj] = useState<TajwidLevel>('sedang');
  const [tajwidKelancaran, setTajwidKelancaran] = useState<TajwidLevel>('sedang');
  const [tajwidNilai, setTajwidNilai] = useState<TajwidLevel>('sedang');

  const selectedSurah = getSurahByNumber(surahNum);
  const selectedJuz = getHalamanByJuz(juzNum);
  const selectedJuzRange = getJuzPageRange(juzNum);
  const totalProgress = mode === 'surat' ? selectedSurah?.ayat ?? 1 : selectedJuz?.halaman ?? 1;
  const currentReached = mode === 'surat' ? ayatReached : pageReached;
  const persen = hitungPersenHafalan(currentReached, totalProgress);
  const db = createClient();

  const load = () => {
    tampilRiwayatHafalan(enrollmentId).then(d => { setRiwayat(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  // Listener untuk membuka form dari StudentSummaryCard (Peta Surat / Input Sesi Hari Ini)
  useEffect(() => {
    const handleTrigger = (e: any) => {
      setShowForm(true);
      if (e.detail?.mode === 'juz') {
        setMode('juz');
        if (e.detail.juzNumber) setJuzNum(e.detail.juzNumber);
      } else if (e.detail?.surahNumber) {
        setMode('surat');
        setSurahNum(e.detail.surahNumber);
        setAyatReached(0);
      }
    };
    window.addEventListener('open-hafalan-session', handleTrigger);
    return () => window.removeEventListener('open-hafalan-session', handleTrigger);
  }, []);

  // Smart pre-fill: Lanjutkan hafalan dari sesi terakhir murid secara otomatis
  useEffect(() => {
    if (riwayat && riwayat.length > 0) {
      const latest = riwayat[0];
      if (latest.surah_number === 0 && latest.surah_name.startsWith('Juz ')) {
        const parsedJuz = parseInt(latest.surah_name.replace('Juz ', '').split(' ')[0], 10);
        if (!Number.isNaN(parsedJuz)) {
          setMode('juz');
          setJuzNum(parsedJuz);
          setPageReached(latest.ayat_reached);
          return;
        }
      }

      if (latest.ayat_reached === latest.total_ayat) {
        // Jika surat sebelumnya sudah lunas/selesai, tawarkan surat berikutnya secara otomatis
        if (latest.surah_number < 114) {
          setMode('surat');
          setSurahNum(latest.surah_number + 1);
          setAyatReached(0);
        } else {
          setMode('surat');
          setSurahNum(latest.surah_number);
          setAyatReached(latest.ayat_reached);
        }
      } else {
        // Jika masih berproses, lanjutkan dari ayat terakhir
        setMode('surat');
        setSurahNum(latest.surah_number);
        setAyatReached(latest.ayat_reached);
      }
    }
  }, [riwayat]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'surat' && !selectedSurah) return;
    if (mode === 'juz' && !selectedJuz) return;

    setIsSaving(true);
    try {
      const surahName = mode === 'surat' ? selectedSurah!.name : `Juz ${juzNum}`;
      const total = mode === 'surat' ? selectedSurah!.ayat : selectedJuz!.halaman;
      const reached = mode === 'surat' ? ayatReached : pageReached;

      await simpanHafalan({
        enrollmentId,
        guruId,
        mode,
        surahNumber: mode === 'surat' ? selectedSurah!.number : undefined,
        surahName,
        totalAyat: total,
        ayatReached: reached,
        sessionDate,
        notes,
        juzNumber: mode === 'juz' ? juzNum : undefined,
        status,
        is_pr: isPr,
        pr_notes_guru: isPr ? prNotesGuru : undefined,
      });

      // Simpan penilaian tajwid secara paralel jika diaktifkan guru (opsional)
      if (enableTajwid) {
        try {
          await simpanAssessmentTajwid({
            enrollmentId,
            guruId,
            sessionDate,
            makhrajLevel: tajwidMakhraj,
            makhrajNotes: '',
            kelancaranLevel: tajwidKelancaran,
            kelancaranNotes: '',
            tajwidLevel: tajwidNilai,
            tajwidNotes: '',
          });
        } catch (tajwidErr) {
          // Tidak gagalkan setoran jika tajwid error
          console.warn('[TabHafalan] Gagal simpan tajwid (opsional):', tajwidErr);
        }
      }

      if (studentPhone) {
        const examNote = examPages ? `\n\nUjian setelah ${examPages} halaman.` : "";
        const customNote = notes ? `\n\nCatatan ustadz:\n"${notes}"` : "";
        const msg = mode === 'surat'
          ? `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nAlhamdulillah, hari ini ananda *${studentName}* telah menyelesaikan setoran hafalan baru:\n\n📖 *Surat ${selectedSurah!.name}*\n🎯 Pencapaian: *Ayat 1 s.d. ${ayatReached}* (dari total ${selectedSurah!.ayat} ayat).${customNote}${examNote}\n\nSemoga ananda istiqomah dan terus bersemangat dalam menjaga serta meningkatkan hafalannya. Aamiin.\n\nJazakumullah khairan.\n— Bimbel Madani`
          : `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nAlhamdulillah, hari ini ananda *${studentName}* telah menyelesaikan setoran hafalan baru:\n\n📖 *Juz ${juzNum}*\n🎯 Pencapaian: *Halaman 1 s.d. ${pageReached}* (dari total ${selectedJuz!.halaman} halaman).${customNote}${examNote}\n\nSemoga ananda istiqomah dan terus bersemangat dalam menjaga serta meningkatkan hafalannya. Aamiin.\n\nJazakumullah khairan.\n— Bimbel Madani`;

        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: studentPhone, message: msg }),
        });
      }
    } catch (err) {
      console.error("Gagal mengirim notifikasi hafalan:", err);
    }

    setShowForm(false);
    setNotes("");
    setIsPr(false);
    setPrNotesGuru("");
    setAyatReached(0);
    setPageReached(0);
    setStatus('lulus');
    load();
    setIsSaving(false);
    window.dispatchEvent(new Event('refresh-student-summary'));
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus sesi hafalan ini?")) return;
    await db.from("hafalan_progress").delete().eq("id", id);
    load();
    window.dispatchEvent(new Event('refresh-student-summary'));
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setShowForm(!showForm)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
          <Plus size={18} /> Input Sesi Hafalan Baru
        </button>
        <button
          type="button"
          onClick={() => setShowMushaf(true)}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition text-sm"
        >
          <BookOpen size={16} /> Mushaf
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Sesi Hafalan</h3>
            <button
              type="button"
              onClick={() => setShowMushaf(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <BookOpen size={13} /> Lihat Mushaf
            </button>
          </div>

          {/* ── STATUS LULUS / NGULANG ── */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Hasil Sesi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('lulus')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-bold transition ${
                  status === 'lulus'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <span>✅</span> Lulus
              </button>
              <button
                type="button"
                onClick={() => setStatus('ngulang')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border font-bold transition ${
                  status === 'ngulang'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300'
                }`}
              >
                <span>🔄</span> Ngulang
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode('surat')}
                className={`px-4 py-3 rounded-2xl border font-semibold transition ${mode === 'surat' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Surat
              </button>
              <button type="button" onClick={() => setMode('juz')}
                className={`px-4 py-3 rounded-2xl border font-semibold transition ${mode === 'juz' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Juz
              </button>
            </div>

            {mode === 'surat' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Surat</label>
                <select value={surahNum} onChange={e => { setSurahNum(+e.target.value); setAyatReached(0); }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  {QURAN_SURAHS.map(s => (
                    <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.ayat} ayat)</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Juz</label>
                <select value={juzNum} onChange={e => { setJuzNum(+e.target.value); setPageReached(0); }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  {QURAN_JUZS.map(j => (
                    <option key={j.number} value={j.number}>{j.name} ({j.halaman} halaman)</option>
                  ))}
                </select>
                {selectedJuzRange && (
                  <p className="text-xs text-slate-500 mt-2">Range halaman: {selectedJuzRange.start}–{selectedJuzRange.end}</p>
                )}
              </div>
            )}

            {mode === 'juz' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Sistem Kelipatan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setJuzKelipatan(3); setPageReached(0); }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${juzKelipatan === 3 ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      Kelipatan 3 Halaman
                    </button>
                    <button type="button" onClick={() => { setJuzKelipatan(5); setPageReached(0); }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${juzKelipatan === 5 ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      Kelipatan 5 Halaman
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Pintasan Setoran ({juzKelipatan} Halaman)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {juzKelipatan === 3 ? (
                      <>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 3))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 3 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Pertama (Hlm 3)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 6))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 6 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Kedua (Hlm 6)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 9))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 9 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Ketiga (Hlm 9)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 12))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 12 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Keempat (Hlm 12)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 15))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 15 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Kelima (Hlm 15)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 18))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 18 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          3 Hlm Keenam (Hlm 18)
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 5))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 5 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          5 Hlm Pertama (Hlm 5)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 10))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 10 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          5 Hlm Kedua (Hlm 10)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 15))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 15 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          5 Hlm Ketiga (Hlm 15)
                        </button>
                        <button type="button" onClick={() => setPageReached(Math.min(totalProgress, 20))}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition ${pageReached === 20 ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>
                          5 Hlm Keempat (Hlm 20)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {mode === 'surat' ? 'Ayat Dicapai' : 'Halaman Dicapai'} <span className="text-slate-400 font-normal">(maks. {totalProgress})</span>
              </label>
              <div className="py-2 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={totalProgress}
                  step={1}
                  value={currentReached}
                  onChange={e => {
                    const next = Math.min(totalProgress, Math.max(0, +e.target.value));
                    if (mode === 'surat') setAyatReached(next); else setPageReached(next);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-[4rem] rounded-2xl bg-slate-50 px-4 py-3 border border-slate-200 text-slate-900 font-semibold text-center">
                  {currentReached}
                </div>
                <div className="flex gap-2 flex-1 flex-wrap">
                  <button type="button" onClick={() => {
                    const next = currentReached - 1;
                    if (mode === 'surat') setAyatReached(Math.max(0, next)); else setPageReached(Math.max(0, next));
                  }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-200">
                    -1
                  </button>
                  <button type="button" onClick={() => {
                    const next = currentReached + 1;
                    if (mode === 'surat') setAyatReached(Math.min(totalProgress, next)); else setPageReached(Math.min(totalProgress, next));
                  }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold border border-slate-200">
                    +1
                  </button>
                  <button type="button" onClick={() => {
                    if (mode === 'surat') setAyatReached(totalProgress); else setPageReached(totalProgress);
                  }}
                    className="ml-auto px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 border border-emerald-200">
                    Set Selesai
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{currentReached}/{totalProgress} {mode === 'surat' ? 'ayat' : 'halaman'}</span>
                  <span className="font-bold">{persen}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(persen)}`} style={{ width: `${persen}%` }} />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Ustadz/Ustadzah (Opsional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk sesi ini (contoh: tajwid lancar)..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[80px]"
                />
              </div>
            </div>

          {/* ── Quick Tajwid Assessment (Opsional) ── */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setEnableTajwid(!enableTajwid)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition ${
                enableTajwid ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2"><Star size={15} /> Nilai Tajwid (Opsional)</span>
              <span className="text-xs font-normal opacity-70">{enableTajwid ? 'Aktif — klik untuk nonaktifkan' : 'Klik untuk aktifkan'}</span>
            </button>

            {enableTajwid && (
              <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                {([
                  { label: 'Makhroj Huruf', value: tajwidMakhraj, set: setTajwidMakhraj },
                  { label: 'Kelancaran', value: tajwidKelancaran, set: setTajwidKelancaran },
                  { label: 'Tajwid', value: tajwidNilai, set: setTajwidNilai },
                ] as const).map(({ label, value, set }) => (
                  <div key={label}>
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
                    <div className="flex gap-1.5">
                      {(['mulai', 'sedang', 'lancar'] as const).map((lvl) => {
                        const cfg = TAJWID_LEVELS[lvl];
                        return (
                          <button key={lvl} type="button" onClick={() => set(lvl)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition ${
                              value === lvl ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tugaskan untuk Disimak di Rumah (PR) ── */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏠</span>
                <div>
                  <label htmlFor="toggle-pr-hafalan" className="text-sm font-bold text-amber-900 cursor-pointer">
                    Tugaskan untuk Disimak di Rumah (PR)
                  </label>
                  <p className="text-xs text-amber-700">
                    Orang tua akan menyimak di rumah, dibantu mushaf & audio murottal
                  </p>
                </div>
              </div>
              <input
                id="toggle-pr-hafalan"
                type="checkbox"
                checked={isPr}
                onChange={(e) => setIsPr(e.target.checked)}
                className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
              />
            </div>

            {isPr && (
              <div className="pt-2 border-t border-amber-200/70">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Pesan / Instruksi Khusus untuk Orang Tua (Opsional)
                </label>
                <input
                  type="text"
                  value={prNotesGuru}
                  onChange={(e) => setPrNotesGuru(e.target.value)}
                  placeholder="Contoh: Mohon disimak bacaan mad dan ghunnahnya..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition border border-slate-200">Batal</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
            </button>
          </div>
        </div>
        </form>
      )}

      {/* Riwayat */}
      <div className="space-y-3">
        {riwayat.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            <BookOpen className="mx-auto mb-2 text-slate-300" size={32} />
            <p>Belum ada sesi hafalan yang tercatat.</p>
          </div>
        ) : (
          <>
            {(showAll ? riwayat : riwayat.slice(0, LIMIT)).map(r => {
              const p = hitungPersenHafalan(r.ayat_reached, r.total_ayat);
              const statusLulus = (r.status ?? 'lulus') === 'lulus';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedDetail(r)}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {r.surah_name}
                        </p>
                        {/* ── STATUS BADGE ── */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          statusLulus
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {statusLulus ? '✅ Lulus' : '🔄 Ngulang'}
                        </span>
                        {/* ── PR / DISIMAK ORTU BADGE ── */}
                        {r.is_pr && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            r.parent_simak_at
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {r.parent_simak_at ? (
                              <>🏠 Disimak Ortu: ⭐ {r.parent_rating}/5 · {r.parent_status}</>
                            ) : (
                              <>🏠 Tugas Rumah (PR)</>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm font-black text-blue-600">{r.ayat_reached}/{r.total_ayat}</span>
                      <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusLulus ? getProgressColor(p) : 'bg-amber-400'}`} style={{ width: `${p}%` }} />
                  </div>
                  {r.notes && <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">"Guru: {r.notes}"</p>}
                  {r.is_pr && r.parent_notes && (
                    <p className="text-xs text-amber-700 mt-1 italic line-clamp-2 bg-amber-50/70 p-1.5 rounded-lg border border-amber-100">
                      "Wali: {r.parent_notes}"
                    </p>
                  )}
                </div>
              );
            })}
            {riwayat.length > LIMIT && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition flex items-center justify-center gap-2"
              >
                {showAll
                  ? `↑ Sembunyikan (tampilkan ${LIMIT} terbaru)`
                  : `↓ Lihat ${riwayat.length - LIMIT} riwayat lainnya`}
              </button>
            )}
          </>
        )}
      </div>

      {/* MODAL DETAIL HAFALAN */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Rincian Hafalan</span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedDetail.surah_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tanggal: {new Date(selectedDetail.session_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Pencapaian Hafalan</p>
                  <p className="text-2xl font-black text-blue-600">
                    {selectedDetail.ayat_reached} <span className="text-sm font-bold text-slate-500">/ {selectedDetail.total_ayat} {selectedDetail.surah_number === 0 ? 'Halaman' : 'Ayat'}</span>
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${
                    (selectedDetail.status ?? 'lulus') === 'lulus'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {(selectedDetail.status ?? 'lulus') === 'lulus' ? '✅ Lulus' : '🔄 Ngulang'}
                  </span>
                  <span className="text-2xl font-black text-emerald-600">
                    {hitungPersenHafalan(selectedDetail.ayat_reached, selectedDetail.total_ayat)}%
                  </span>
                  <p className="text-[11px] text-slate-400">Tuntas</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Catatan Ustadz / Evaluasi</p>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-sm text-slate-700 min-h-[70px]">
                  {selectedDetail.notes ? (
                    <p className="italic">"{selectedDetail.notes}"</p>
                  ) : (
                    <p className="text-slate-400 italic">Tidak ada catatan tambahan.</p>
                  )}
                </div>
              </div>

              {/* Status PR & Simakan Orang Tua */}
              {selectedDetail.is_pr && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      🏠 Tugas Rumah (PR Disimak Orang Tua)
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      selectedDetail.parent_simak_at
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {selectedDetail.parent_simak_at ? '✅ Telah Disimak' : '⏳ Belum Disimak'}
                    </span>
                  </div>

                  {selectedDetail.pr_notes_guru && (
                    <p className="text-xs text-amber-800 bg-white p-2.5 rounded-xl border border-amber-200/60">
                      <strong>Pesan Ustadz:</strong> {selectedDetail.pr_notes_guru}
                    </p>
                  )}

                  {selectedDetail.parent_simak_at ? (
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Status: <span className="text-emerald-700 uppercase">{selectedDetail.parent_status}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Disimak pada: {new Date(selectedDetail.parent_simak_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center text-amber-500 font-black text-sm">
                          {"★".repeat(selectedDetail.parent_rating || 0)}
                          <span className="text-xs text-slate-500 ml-1">({selectedDetail.parent_rating}/5)</span>
                        </div>
                      </div>
                      {selectedDetail.parent_notes && (
                        <p className="text-xs text-slate-600 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                          Catatan Orang Tua: "{selectedDetail.parent_notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 italic">
                      Menunggu orang tua menyimak ananda di rumah dan memberikan penilaian di dashboard murid.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const target = selectedDetail;
                  setSelectedDetail(null);
                  if (target.surah_number === 0 && target.surah_name.startsWith('Juz ')) {
                    const parsedJuz = parseInt(target.surah_name.replace('Juz ', '').split(' ')[0], 10);
                    setMode('juz');
                    if (!Number.isNaN(parsedJuz)) setJuzNum(parsedJuz);
                    setPageReached(target.ayat_reached);
                  } else {
                    setMode('surat');
                    setSurahNum(target.surah_number);
                    setAyatReached(target.ayat_reached);
                  }
                  if (target.notes) setNotes(target.notes);
                  setStatus(target.status ?? 'lulus');
                  setIsPr(target.is_pr ?? false);
                  setPrNotesGuru(target.pr_notes_guru ?? '');
                  setShowForm(true);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition"
              >
                Perbarui / Edit Sesi Ini
              </button>
              <button
                onClick={() => setSelectedDetail(null)}
                className="py-3 px-4 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mushaf Viewer Drawer ── */}
      <MushafViewer
        isOpen={showMushaf}
        onClose={() => setShowMushaf(false)}
        initialMode={mode}
        initialSurahNumber={surahNum}
        initialJuzNumber={juzNum}
        highlightFrom={mode === 'surat' ? 1 : undefined}
        highlightTo={mode === 'surat' ? ayatReached : undefined}
      />
    </div>
  );
}
