"use client";
import { useEffect, useState } from "react";
import { tampilRiwayatHafalan, simpanHafalan, hitungPersenHafalan } from "@/services/hafalanService";
import type { HafalanProgress } from "@/types";
import { QURAN_SURAHS, getSurahByNumber } from "@/lib/quranData";
import { QURAN_JUZS, getHalamanByJuz, getJuzPageRange } from "@/lib/quranJuz";
import { getProgressColor } from "@/lib/helpers";
import { Loader2, BookOpen, Plus, Trash2 } from "lucide-react";
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

  // Form state
  const [mode, setMode] = useState<'surat' | 'juz'>('surat');
  const [surahNum, setSurahNum] = useState(1);
  const [juzNum, setJuzNum] = useState(1);
  const [ayatReached, setAyatReached] = useState(0);
  const [pageReached, setPageReached] = useState(0);
  const [examPages, setExamPages] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const selectedSurah = getSurahByNumber(surahNum);
  const selectedJuz = getHalamanByJuz(juzNum);
  const selectedJuzRange = getJuzPageRange(juzNum);
  const totalProgress = mode === 'surat' ? selectedSurah?.ayat ?? 1 : selectedJuz?.halaman ?? 1;
  const currentReached = mode === 'surat' ? ayatReached : pageReached;
  const keyframeMarks = [3, 5, 8, 10, 13, 15, 18, 20];
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {mode === 'surat' ? 'Ayat Dicapai' : 'Halaman Dicapai'} <span className="text-slate-400 font-normal">(maks. {totalProgress})</span>
              </label>
              <div className="relative">
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
                  className="w-full accent-blue-600"
                />
                <div className="pointer-events-none absolute inset-x-0 top-8 h-6">
                  {keyframeMarks.map(mark => {
                    const left = totalProgress > 0 ? Math.min(100, (mark / totalProgress) * 100) : 0;
                    const reached = currentReached >= mark;
                    return (
                      <div key={mark} style={{ left: `${left}%` }} className="absolute top-0 -translate-x-1/2 text-center">
                        <span className={`block h-2 w-2 rounded-full ${reached ? 'bg-emerald-500 border border-emerald-600' : 'bg-slate-300 border border-slate-200'}`} />
                        <span className={`mt-1 block text-[10px] ${reached ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>{mark}</span>
                      </div>
                    );
                  })}
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

              {isKeyframeReached && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Peringatan: Anda sudah mencapai titik ujian penting pada {mode === 'surat' ? 'ayat' : 'halaman'} {currentReached}. Sebaiknya lakukan ujian hafalan sebelum menambah setoran baru.
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
        ) : riwayat.map(r => {
          const p = hitungPersenHafalan(r.ayat_reached, r.total_ayat);
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-900">{r.surah_name}</p>
                  <p className="text-xs text-slate-400">{new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-600">{r.ayat_reached}/{r.total_ayat}</span>
                  <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${getProgressColor(p)}`} style={{ width: `${p}%` }} />
              </div>
              {r.notes && <p className="text-xs text-slate-500 mt-2 italic">"{r.notes}"</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
