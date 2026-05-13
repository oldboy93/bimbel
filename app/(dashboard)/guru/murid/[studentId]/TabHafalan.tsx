"use client";
import { useEffect, useState } from "react";
import { tampilRiwayatHafalan, simpanHafalan, hitungPersenHafalan } from "@/services/hafalanService";
import type { HafalanProgress } from "@/types";
import { QURAN_SURAHS, getSurahByNumber } from "@/lib/quranData";
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
  const [surahNum, setSurahNum] = useState(1);
  const [ayatReached, setAyatReached] = useState(0);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const selectedSurah = getSurahByNumber(surahNum);
  const persen = hitungPersenHafalan(ayatReached, selectedSurah?.ayat ?? 1);
  const db = createClient();

  const load = () => {
    tampilRiwayatHafalan(enrollmentId).then(d => { setRiwayat(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  // Smart pre-fill: Lanjutkan hafalan dari sesi terakhir murid secara otomatis
  useEffect(() => {
    if (riwayat && riwayat.length > 0) {
      const latest = riwayat[0];
      if (latest.ayat_reached === latest.total_ayat) {
        // Jika surat sebelumnya sudah lunas/selesai, tawarkan surat berikutnya secara otomatis
        if (latest.surah_number < 114) {
          setSurahNum(latest.surah_number + 1);
          setAyatReached(0);
        } else {
          setSurahNum(latest.surah_number);
          setAyatReached(latest.ayat_reached);
        }
      } else {
        // Jika masih berproses, lanjutkan dari ayat terakhir
        setSurahNum(latest.surah_number);
        setAyatReached(latest.ayat_reached);
      }
    }
  }, [riwayat]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSurah) return;
    setIsSaving(true);
    try {
      await simpanHafalan({
        enrollmentId, guruId,
        surahNumber: selectedSurah.number, surahName: selectedSurah.name,
        totalAyat: selectedSurah.ayat, ayatReached, sessionDate, notes,
      });

      // Kirim WA jika ada nomor telepon wali siswa
      if (studentPhone) {
        const customNote = notes ? `\n\nCatatan ustadz:\n"${notes}"` : "";
        const msg = `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nAlhamdulillah, hari ini ananda *${studentName}* telah menyelesaikan setoran hafalan baru:\n\n📖 *Surat ${selectedSurah.name}*\n🎯 Pencapaian: *Ayat 1 s.d. ${ayatReached}* (dari total ${selectedSurah.ayat} ayat).${customNote}\n\nSemoga ananda istiqomah dan terus bersemangat dalam menjaga serta meningkatkan hafalannya. Aamiin.\n\nJazakumullah khairan.\n— Bimbel Madani`;

        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: studentPhone, message: msg }),
        });
      }
    } catch (err) {
      console.error("Gagal mengirim notifikasi hafalan:", err);
    }

    setShowForm(false); setNotes(""); setAyatReached(0);
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

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Surat</label>
            <select value={surahNum} onChange={e => { setSurahNum(+e.target.value); setAyatReached(0); }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              {QURAN_SURAHS.map(s => (
                <option key={s.number} value={s.number}>{s.number}. {s.name} ({s.ayat} ayat)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Ayat Dicapai <span className="text-slate-400 font-normal">(maks. {selectedSurah?.ayat})</span>
            </label>
            <input type="number" min={0} max={selectedSurah?.ayat ?? 1} value={ayatReached}
              onChange={e => setAyatReached(Math.min(+e.target.value, selectedSurah?.ayat ?? 1))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            
            {/* Tombol Aksi Cepat Ayat */}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAyatReached(prev => Math.max(0, prev - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200"
              >
                -1 Ayat
              </button>
              <button
                type="button"
                onClick={() => setAyatReached(prev => Math.min(selectedSurah?.ayat ?? 1, prev + 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200"
              >
                +1 Ayat
              </button>
              <button
                type="button"
                onClick={() => setAyatReached(selectedSurah?.ayat ?? 0)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition border border-emerald-200 ml-auto"
              >
                Set Selesai ({selectedSurah?.ayat} Ayat)
              </button>
            </div>

            {/* Progress preview */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{ayatReached}/{selectedSurah?.ayat} ayat</span>
                <span className="font-bold">{persen}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${getProgressColor(persen)}`} style={{ width: `${persen}%` }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Sesi</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Kelancaran, kesulitan, dll..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition border border-slate-200">Batal</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
            </button>
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
