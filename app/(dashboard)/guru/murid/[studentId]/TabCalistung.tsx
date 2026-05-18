"use client";
import { useEffect, useState } from "react";
import { tampilAssessmentTajwid, simpanAssessmentTajwid } from "@/services/gradeService";
import type { TajwidAssessment } from "@/types";
import { TAJWID_LEVELS } from "@/lib/helpers";
import { Loader2, Sparkles, Plus, Trash2, BookOpen, PenTool, Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props { enrollmentId: string; guruId: string; }

type Level = "mulai" | "sedang" | "lancar";
const LEVELS: Level[] = ["mulai", "sedang", "lancar"];

interface CalistungData {
  isCalistung: boolean;
  // Membaca
  membaca_gambar: Level;
  membaca_kalimat: Level;
  membaca_mengeja: Level;
  membaca_tanda: Level;
  // Menulis
  menulis_memegang: Level;
  menulis_huruf: Level;
  menulis_kalimat: Level;
  // Menghitung
  hitung_bilangan: Level;
  hitung_operasi: Level;
  // Catatan
  catatan_tambahan?: string;
}

const DEFAULT_CALISTUNG: CalistungData = {
  isCalistung: true,
  membaca_gambar: "mulai",
  membaca_kalimat: "mulai",
  membaca_mengeja: "mulai",
  membaca_tanda: "mulai",
  menulis_memegang: "mulai",
  menulis_huruf: "mulai",
  menulis_kalimat: "mulai",
  hitung_bilangan: "mulai",
  hitung_operasi: "mulai",
  catatan_tambahan: ""
};

export default function TabCalistung({ enrollmentId, guruId }: Props) {
  const [riwayat, setRiwayat] = useState<TajwidAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [formState, setFormState] = useState<CalistungData>(DEFAULT_CALISTUNG);

  const db = createClient();

  const load = () => {
    tampilAssessmentTajwid(enrollmentId).then(d => {
      // Hanya tampilkan assessment yang berformat Calistung
      const calistungOnly = d.filter(item => {
        try {
          const parsed = JSON.parse(item.tajwid_notes || "");
          return parsed && parsed.isCalistung === true;
        } catch {
          return false;
        }
      });
      setRiwayat(calistungOnly);
      setIsLoading(false);
    });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  // Pre-fill dari penilaian calistung terakhir jika ada
  useEffect(() => {
    if (riwayat && riwayat.length > 0) {
      try {
        const latest = JSON.parse(riwayat[0].tajwid_notes || "");
        if (latest.isCalistung) {
          setFormState({
            isCalistung: true,
            membaca_gambar: latest.membaca_gambar || "mulai",
            membaca_kalimat: latest.membaca_kalimat || "mulai",
            membaca_mengeja: latest.membaca_mengeja || "mulai",
            membaca_tanda: latest.membaca_tanda || "mulai",
            menulis_memegang: latest.menulis_memegang || "mulai",
            menulis_huruf: latest.menulis_huruf || "mulai",
            menulis_kalimat: latest.menulis_kalimat || "mulai",
            hitung_bilangan: latest.hitung_bilangan || "mulai",
            hitung_operasi: latest.hitung_operasi || "mulai",
            catatan_tambahan: ""
          });
        }
      } catch (e) {
        // Abaikan
      }
    }
  }, [riwayat]);

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus penilaian calistung ini?")) return;
    await db.from("tajwid_assessments").delete().eq("id", id);
    load();
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Serialisasikan state Calistung ke dalam kolom tajwid_notes
    await simpanAssessmentTajwid({
      enrollmentId,
      guruId,
      sessionDate,
      makhrajLevel: "mulai",
      kelancaranLevel: "mulai",
      tajwidLevel: "mulai",
      tajwidNotes: JSON.stringify(formState)
    });
    setShowForm(false);
    load();
    setIsSaving(false);
  };

  const updateItem = (key: keyof CalistungData, value: Level) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const RatingSelector = ({ label, value, onChange }: { label: string; value: Level; onChange: (v: Level) => void }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
      <span className="text-xs font-bold text-slate-700 max-w-xs">{label}</span>
      <div className="flex gap-1.5 w-full sm:w-64">
        {LEVELS.map(l => {
          const cfg = TAJWID_LEVELS[l];
          return (
            <button key={l} type="button" onClick={() => onChange(l)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold border-2 transition ${
                value === l ? `${cfg.bg} ${cfg.color} border-current` : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              }`}>
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition">
        <Plus size={18} /> Input Penilaian Calistung
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-900 flex items-center gap-2"><Sparkles className="text-blue-500" size={18} /> Lembar Penilaian Calistung</h3>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* A. KOMPONEN MEMBACA */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-blue-600 text-xs tracking-wider uppercase flex items-center gap-2 mb-2">
              <BookOpen size={14} /> 1. Target Membaca
            </h4>
            <RatingSelector label="1. Mampu membaca gambar" value={formState.membaca_gambar} onChange={v => updateItem("membaca_gambar", v)} />
            <RatingSelector label="2. Mampu membaca bacaan kalimat, bacaan kalimat sederhana, membaca huruf kapital, intonasi membaca" value={formState.membaca_kalimat} onChange={v => updateItem("membaca_kalimat", v)} />
            <RatingSelector label="3. Mampu mengeja suku kata" value={formState.membaca_mengeja} onChange={v => updateItem("membaca_mengeja", v)} />
            <RatingSelector label="4. Mengenal tanda baca" value={formState.membaca_tanda} onChange={v => updateItem("membaca_tanda", v)} />
          </div>

          {/* B. KOMPONEN MENULIS */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-indigo-600 text-xs tracking-wider uppercase flex items-center gap-2 mb-2">
              <PenTool size={14} /> 2. Target Pembelajaran Menulis
            </h4>
            <RatingSelector label="1. Cara memegang alat tulis dan jarak mata" value={formState.menulis_memegang} onChange={v => updateItem("menulis_memegang", v)} />
            <RatingSelector label="2. Menulis huruf besar dan kecil" value={formState.menulis_huruf} onChange={v => updateItem("menulis_huruf", v)} />
            <RatingSelector label="3. Menulis kata atau kalimat sederhana" value={formState.menulis_kalimat} onChange={v => updateItem("menulis_kalimat", v)} />
          </div>

          {/* C. KOMPONEN MENGHITUNG */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-emerald-600 text-xs tracking-wider uppercase flex items-center gap-2 mb-2">
              <Calculator size={14} /> 3. Target Pembelajaran Menghitung
            </h4>
            <RatingSelector label="1. Mengenal bilangan puluhan - ratusan" value={formState.hitung_bilangan} onChange={v => updateItem("hitung_bilangan", v)} />
            <RatingSelector label="2. Mengenal penjumlahan dan pengurangan pada bilangan" value={formState.hitung_operasi} onChange={v => updateItem("hitung_operasi", v)} />
          </div>

          {/* CATATAN */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan</label>
            <textarea value={formState.catatan_tambahan || ""} onChange={e => setFormState(prev => ({ ...prev, catatan_tambahan: e.target.value }))} rows={2}
              placeholder="Catatan perkembangan belajar murid..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-slate-500 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition">Batal</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan Penilaian"}
            </button>
          </div>
        </form>
      )}

      {/* Riwayat Assessment */}
      <div className="space-y-3">
        {riwayat.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            <Sparkles className="mx-auto mb-2 text-slate-300" size={32} />
            <p className="text-sm font-bold">Belum ada penilaian Calistung.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk mengisi penilaian sesi murid.</p>
          </div>
        ) : riwayat.map(r => {
          let cData: CalistungData;
          try {
            cData = JSON.parse(r.tajwid_notes || "");
          } catch {
            return null;
          }
          if (!cData || !cData.isCalistung) return null;

          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                <p className="text-xs font-black text-slate-400">
                  {new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition -mt-1.5 -mr-1.5">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Membaca */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><BookOpen size={12} /> Target Membaca</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">1. Membaca gambar</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.membaca_gambar]?.bg} ${TAJWID_LEVELS[cData.membaca_gambar]?.color}`}>{TAJWID_LEVELS[cData.membaca_gambar]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">2. Membaca kalimat & kapital</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.membaca_kalimat]?.bg} ${TAJWID_LEVELS[cData.membaca_kalimat]?.color}`}>{TAJWID_LEVELS[cData.membaca_kalimat]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">3. Mengeja suku kata</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.membaca_mengeja]?.bg} ${TAJWID_LEVELS[cData.membaca_mengeja]?.color}`}>{TAJWID_LEVELS[cData.membaca_mengeja]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">4. Tanda baca</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.membaca_tanda]?.bg} ${TAJWID_LEVELS[cData.membaca_tanda]?.color}`}>{TAJWID_LEVELS[cData.membaca_tanda]?.label}</span>
                  </div>
                </div>
              </div>

              {/* Menulis */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5"><PenTool size={12} /> Target Menulis</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">1. Cara memegang pensil</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.menulis_memegang]?.bg} ${TAJWID_LEVELS[cData.menulis_memegang]?.color}`}>{TAJWID_LEVELS[cData.menulis_memegang]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">2. Huruf besar & kecil</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.menulis_huruf]?.bg} ${TAJWID_LEVELS[cData.menulis_huruf]?.color}`}>{TAJWID_LEVELS[cData.menulis_huruf]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">3. Kata/kalimat sederhana</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.menulis_kalimat]?.bg} ${TAJWID_LEVELS[cData.menulis_kalimat]?.color}`}>{TAJWID_LEVELS[cData.menulis_kalimat]?.label}</span>
                  </div>
                </div>
              </div>

              {/* Menghitung */}
              <div className="space-y-2">
                <h5 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><Calculator size={12} /> Target Menghitung</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">1. Bilangan puluhan-ratusan</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.hitung_bilangan]?.bg} ${TAJWID_LEVELS[cData.hitung_bilangan]?.color}`}>{TAJWID_LEVELS[cData.hitung_bilangan]?.label}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">2. Penjumlahan & pengurangan</span>
                    <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${TAJWID_LEVELS[cData.hitung_operasi]?.bg} ${TAJWID_LEVELS[cData.hitung_operasi]?.color}`}>{TAJWID_LEVELS[cData.hitung_operasi]?.label}</span>
                  </div>
                </div>
              </div>

              {cData.catatan_tambahan && (
                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Ustadz/Ustadzah:</span>
                  <p className="text-xs text-slate-700 font-medium italic mt-1">&ldquo;{cData.catatan_tambahan}&rdquo;</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
