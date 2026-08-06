"use client";

import { useEffect, useState } from "react";
import { tampilRiwayatMurajaah, simpanMurajaah, hapusMurajaah } from "@/services/murajaahService";
import { tampilRiwayatHafalan } from "@/services/hafalanService";
import type { MurajaahSession, HafalanProgress } from "@/types";
import { QURAN_SURAHS } from "@/lib/quranData";
import { Loader2, RefreshCw, Plus, Trash2, CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  enrollmentId: string;
  guruId: string;
  studentPhone?: string;
  studentName?: string;
}

const QUALITY_CONFIG = {
  lancar: { label: "Lancar", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  perlu_perbaikan: { label: "Perlu Perbaikan", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: AlertTriangle },
  mengulang: { label: "Harus Mengulang", color: "bg-red-50 text-red-700 border-red-200", icon: RotateCcw },
};

export default function TabMurajaah({ enrollmentId, guruId, studentPhone, studentName }: Props) {
  const [riwayat, setRiwayat] = useState<MurajaahSession[]>([]);
  const [hafalanList, setHafalanList] = useState<HafalanProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 2;

  // Form state
  const [hafalanType, setHafalanType] = useState<'surat' | 'juz'>('surat');
  const [selectedHafalanId, setSelectedHafalanId] = useState<string>("");
  const [customSurahName, setCustomSurahName] = useState("");
  const [surahNum, setSurahNum] = useState(1);
  const [ayatOrPageRange, setAyatOrPageRange] = useState("");
  const [quality, setQuality] = useState<'lancar' | 'perlu_perbaikan' | 'mengulang'>('lancar');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const load = async () => {
    try {
      const [mRecords, hRecords] = await Promise.all([
        tampilRiwayatMurajaah(enrollmentId),
        tampilRiwayatHafalan(enrollmentId),
      ]);
      setRiwayat(mRecords);
      setHafalanList(hRecords);
    } catch (err) {
      console.error("Gagal memuat data murajaah:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [enrollmentId]);

  const handleSelectHafalanRef = (refId: string) => {
    setSelectedHafalanId(refId);
    if (!refId) return;

    const target = hafalanList.find(h => h.id === refId);
    if (target) {
      if (target.surah_number === 0 && target.surah_name.startsWith("Juz ")) {
        setHafalanType('juz');
        setCustomSurahName(target.surah_name);
        setAyatOrPageRange(`Halaman 1–${target.ayat_reached}`);
      } else {
        setHafalanType('surat');
        setSurahNum(target.surah_number);
        setCustomSurahName(target.surah_name);
        setAyatOrPageRange(`Ayat 1–${target.ayat_reached}`);
      }
    }
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let finalSurahName = customSurahName;
    let finalSurahNum: number | undefined = surahNum;

    if (hafalanType === 'surat') {
      const s = QURAN_SURAHS.find(x => x.number === surahNum);
      finalSurahName = s ? s.name : customSurahName || "Surat";
      finalSurahNum = surahNum;
    } else if (hafalanType === 'juz' && !finalSurahName) {
      finalSurahName = "Juz";
      finalSurahNum = undefined;
    }

    try {
      await simpanMurajaah({
        enrollmentId,
        guruId,
        hafalanRefId: selectedHafalanId || undefined,
        hafalanType,
        surahNumber: finalSurahNum,
        surahName: finalSurahName,
        ayatOrPageRange,
        quality,
        sessionDate,
        notes,
      });

      if (studentPhone) {
        const customNote = notes ? `\n\nCatatan evaluasi ustadz:\n"${notes}"` : "";
        const msg = `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nAlhamdulillah, hari ini ananda *${studentName}* telah menyelesaikan sesi pengulangan hafalan (Murajaah):\n\n🔄 *${finalSurahName}*\n🎯 Jangkauan: *${ayatOrPageRange || "Pengulangan"}*\n⭐ Kualitas: *${QUALITY_CONFIG[quality].label}*.${customNote}\n\nSemoga hafalan ananda semakin melekat kuat dan berkah. Aamiin.\n\nJazakumullah khairan.\n— Bimbel Madani`;

        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: studentPhone, message: msg }),
        });
      }
    } catch (err) {
      console.error("Gagal menyimpan murajaah:", err);
    }

    setShowForm(false);
    setNotes("");
    load();
    setIsSaving(false);
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus sesi murajaah ini?")) return;
    await hapusMurajaah(id);
    load();
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
        <Plus size={18} /> Input Sesi Murajaah Baru
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw size={18} className="text-blue-600" /> Sesi Murajaah
          </h3>

          <div className="space-y-4">
            {/* Auto-fill Picker dari Hafalan yang Sudah Ada */}
            {hafalanList.length > 0 && (
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  Pilih dari Hafalan Murid yang Sudah Ada
                </label>
                <select
                  value={selectedHafalanId}
                  onChange={e => handleSelectHafalanRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Manual / Pilih dari daftar hafalan --</option>
                  {hafalanList.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.surah_name} ({h.ayat_reached}/{h.total_ayat})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setHafalanType('surat')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${hafalanType === 'surat' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Surat
              </button>
              <button type="button" onClick={() => setHafalanType('juz')}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition ${hafalanType === 'juz' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Juz
              </button>
            </div>

            {hafalanType === 'surat' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Surat Murajaah</label>
                <select value={surahNum} onChange={e => setSurahNum(+e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800">
                  {QURAN_SURAHS.map(s => (
                    <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.ayat} ayat)</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Juz / Surat Murajaah</label>
                <input
                  type="text"
                  placeholder="Contoh: Juz 30 / Surat Al-Baqarah"
                  value={customSurahName}
                  onChange={e => setCustomSurahName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Jangkauan Ayat / Halaman</label>
              <input
                type="text"
                placeholder="Contoh: Ayat 1–15 atau Halaman 1–5"
                value={ayatOrPageRange}
                onChange={e => setAyatOrPageRange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Kualitas Murajaah</label>
              <div className="grid grid-cols-3 gap-2">
                {(['lancar', 'perlu_perbaikan', 'mengulang'] as const).map((q) => {
                  const Icon = QUALITY_CONFIG[q].icon;
                  return (
                    <button key={q} type="button" onClick={() => setQuality(q)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition text-xs font-bold ${quality === q ? QUALITY_CONFIG[q].color + ' border-current shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <Icon size={18} />
                      <span>{QUALITY_CONFIG[q].label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Sesi</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Ustadz/Ustadzah (Opsional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan hasil murajaah..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition border border-slate-200">
                Batal
              </button>
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
            <RefreshCw className="mx-auto mb-2 text-slate-300" size={32} />
            <p>Belum ada catatan murajaah.</p>
          </div>
        ) : (
          <>
            {(showAll ? riwayat : riwayat.slice(0, LIMIT)).map(r => {
              const Icon = QUALITY_CONFIG[r.quality]?.icon ?? CheckCircle2;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-purple-50 text-purple-700 mb-1">
                        Murajaah
                      </span>
                      <p className="font-bold text-slate-900 text-base">
                        {r.surah_name} {r.ayat_or_page_range ? `(${r.ayat_or_page_range})` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-lg border ${QUALITY_CONFIG[r.quality]?.color ?? 'bg-slate-50'}`}>
                        <Icon size={13} />
                        {QUALITY_CONFIG[r.quality]?.label ?? r.quality}
                      </span>
                      <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {r.notes && <p className="text-xs text-slate-500 mt-2 italic">"{r.notes}"</p>}
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
    </div>
  );
}
