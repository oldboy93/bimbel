"use client";
import { useEffect, useState } from "react";
import { tampilRiwayatHafalan, simpanHafalan, hitungPersenHafalan } from "@/services/hafalanService";
import type { HafalanProgress } from "@/types";
import { QURAN_SURAHS, getSurahByNumber } from "@/lib/quranData";
import { QURAN_JUZS, getHalamanByJuz, getJuzPageRange } from "@/lib/quranJuz";
import { getProgressColor } from "@/lib/helpers";
import { Loader2, BookOpen, Plus, Trash2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

  const selectedSurah = getSurahByNumber(surahNum);
  const selectedJuz = getHalamanByJuz(juzNum);
  const selectedJuzRange = getJuzPageRange(juzNum);
  const totalProgress = mode === 'surat' ? selectedSurah?.ayat ?? 1 : selectedJuz?.halaman ?? 1;
  const currentReached = mode === 'surat' ? ayatReached : pageReached;
  const keyframeMarks = juzKelipatan === 3
    ? [3, 6, 9, 12, 15, 18, 21]
    : [5, 10, 15, 20, 25];
  const isKeyframeReached = keyframeMarks.includes(currentReached) && currentReached > 0;
  const availableExamMarks = mode === 'juz'
    ? keyframeMarks.filter(mark => mark <= currentReached)
    : [];
  const persen = hitungPersenHafalan(currentReached, totalProgress);
  const db = createClient();

  useEffect(() => {
    if (mode === 'surat' && examPages !== null) {
      setExamPages(null);
    }
    if (examPages !== null && currentReached < examPages) {
      setExamPages(null);
    }
  }, [mode, currentReached, examPages]);

  const load = () => {
    tampilRiwayatHafalan(enrollmentId).then(d => { setRiwayat(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, [enrollmentId]);

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
      });

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
    setAyatReached(0);
    setPageReached(0);
    setStatus('lulus');
    load();
    setIsSaving(false);
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus sesi hafalan ini?")) return;
    await db.from("hafalan_progress").delete().eq("id", id);
    load();
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
        <Plus size={18} /> Input Sesi Hafalan Baru
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Sesi Hafalan</h3>

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
              <div className="relative py-6 flex items-center">
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
                  className="w-full accent-indigo-600 relative z-20 cursor-pointer"
                />
                <div className="pointer-events-none absolute inset-x-0 flex items-center px-[8px] z-10">
                  <div className="relative w-full">
                    {keyframeMarks.map(mark => {
                      if (mark > totalProgress) return null;
                      const left = totalProgress > 0 ? Math.min(100, (mark / totalProgress) * 100) : 0;
                      const reached = currentReached >= mark;
                      return (
                        <div key={mark} style={{ left: `${left}%` }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center">
                          <div className={`flex items-center justify-center h-6 w-6 rounded-full shadow-sm transition-all z-30 font-bold text-[11px] ${reached ? 'bg-indigo-600 border-[3px] border-white text-white scale-110 shadow-indigo-200' : 'bg-slate-200 border-[3px] border-white text-slate-500'}`}>
                            {mark}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
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

              {mode === 'juz' && availableExamMarks.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Pilih ujian setelah halaman</p>
                  <p className="text-xs text-slate-500 mb-3">Ujian tersedia setelah mencapai titik keyframe.</p>
                  <select value={examPages ?? ''} onChange={e => setExamPages(e.target.value ? +e.target.value : null)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Pilih jumlah halaman ujian</option>
                    {availableExamMarks.map(mark => (
                      <option key={mark} value={mark}>{mark} halaman</option>
                    ))}
                  </select>
                </div>
              )}

              {isKeyframeReached ? (
                <div className="mt-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 text-indigo-200/40 rotate-12">
                    <Trophy size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-200">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-indigo-900 text-lg">Milestone Tercapai! 🎉</h4>
                        <p className="text-sm text-indigo-700 mt-1 leading-relaxed font-medium">
                          Masya Allah, murid telah mencapai titik evaluasi di {mode === 'surat' ? 'ayat' : 'halaman'} ke-{currentReached}.
                          Silakan masukkan catatan evaluasi ustadz/ustadzah di bawah ini sebagai laporan.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <label className="block text-xs font-extrabold text-indigo-900 uppercase tracking-widest mb-2">
                        Catatan Evaluasi Milestone
                      </label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Kelancaran sudah baik, namun panjang pendek (mad) masih perlu diperhatikan..."
                        className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Ustadz/Ustadzah (Opsional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan untuk sesi ini (contoh: tajwid lancar)..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[80px]"
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
                  {r.notes && <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">"{r.notes}"</p>}
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
    </div>
  );
}
