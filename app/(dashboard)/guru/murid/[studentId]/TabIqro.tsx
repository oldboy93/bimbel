"use client";

import { useEffect, useState } from "react";
import { tampilRiwayatIqro, simpanIqro, hapusIqro } from "@/services/iqroService";
import type { IqroProgress } from "@/types";
import { Loader2, BookOpen, Plus, Trash2, Award } from "lucide-react";

interface Props {
  enrollmentId: string;
  guruId: string;
  studentPhone?: string;
  studentName?: string;
}

const LEVEL_CONFIG = {
  kurang: { label: "Perlu Bimbingan", color: "bg-red-50 text-red-700 border-red-200" },
  cukup: { label: "Cukup", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  lancar: { label: "Lancar", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  mahir: { label: "Sangat Mahir", color: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function TabIqro({ enrollmentId, guruId, studentPhone, studentName }: Props) {
  const [riwayat, setRiwayat] = useState<IqroProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [type, setType] = useState<'iqro' | 'aisar'>('iqro');
  const [jilid, setJilid] = useState(1);
  const [halaman, setHalaman] = useState(1);
  const [level, setLevel] = useState<'kurang' | 'cukup' | 'lancar' | 'mahir'>('lancar');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const maxJilid = type === 'iqro' ? 6 : 3;
  const maxHalaman = type === 'iqro' ? 30 : 20;

  const load = () => {
    tampilRiwayatIqro(enrollmentId).then(data => {
      setRiwayat(data);
      setIsLoading(false);

      // Smart autofill from latest session
      if (data && data.length > 0) {
        const latest = data[0];
        setType(latest.type);
        setJilid(latest.jilid);
        setHalaman(Math.min(latest.halaman + 1, latest.total_halaman));
      }
    });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await simpanIqro({
        enrollmentId,
        guruId,
        type,
        jilid,
        halaman,
        totalHalaman: maxHalaman,
        level,
        sessionDate,
        notes,
      });

      if (studentPhone) {
        const customNote = notes ? `\n\nCatatan ustadz/ustadzah:\n"${notes}"` : "";
        const title = type === 'iqro' ? `Iqro Jilid ${jilid}` : `Aisar Modul ${jilid}`;
        const msg = `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nAlhamdulillah, hari ini ananda *${studentName}* telah menyelesaikan pembelajaran membaca:\n\n📖 *${title}*\n🎯 Pencapaian: *Halaman ${halaman}* (Kualitas: ${LEVEL_CONFIG[level].label}).${customNote}\n\nSemoga ananda semakin lancar dan bersemangat dalam membaca Al-Qur'an. Aamiin.\n\nJazakumullah khairan.\n— Bimbel Madani`;

        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: studentPhone, message: msg }),
        });
      }
    } catch (err) {
      console.error("Gagal menyimpan progress Iqro/Aisar:", err);
    }

    setShowForm(false);
    setNotes("");
    load();
    setIsSaving(false);
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus catatan sesi ini?")) return;
    await hapusIqro(id);
    load();
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
        <Plus size={18} /> Input Sesi Iqro & Aisar
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Sesi Iqro / Aisar</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setType('iqro'); setJilid(1); setHalaman(1); }}
                className={`px-4 py-3 rounded-2xl border font-semibold transition ${type === 'iqro' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Iqro (Jilid 1–6)
              </button>
              <button type="button" onClick={() => { setType('aisar'); setJilid(1); setHalaman(1); }}
                className={`px-4 py-3 rounded-2xl border font-semibold transition ${type === 'aisar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                Aisar (Modul 1–3)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {type === 'iqro' ? 'Jilid' : 'Modul'}
                </label>
                <select value={jilid} onChange={e => setJilid(+e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800">
                  {Array.from({ length: maxJilid }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {type === 'iqro' ? `Jilid ${i + 1}` : `Modul ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Halaman</label>
                <input
                  type="number"
                  min={1}
                  max={maxHalaman}
                  value={halaman}
                  onChange={e => setHalaman(Math.min(maxHalaman, Math.max(1, +e.target.value)))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tingkat Kelancaran</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['kurang', 'cukup', 'lancar', 'mahir'] as const).map((lvl) => (
                  <button key={lvl} type="button" onClick={() => setLevel(lvl)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition ${level === lvl ? LEVEL_CONFIG[lvl].color + ' border-current shadow-sm' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {LEVEL_CONFIG[lvl].label}
                  </button>
                ))}
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan perkembangan bacaan murid..."
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
            <BookOpen className="mx-auto mb-2 text-slate-300" size={32} />
            <p>Belum ada catatan Iqro atau Aisar.</p>
          </div>
        ) : (
          riwayat.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-blue-50 text-blue-700 mb-1">
                    {r.type}
                  </span>
                  <p className="font-bold text-slate-900 text-base">
                    {r.type === 'iqro' ? `Jilid ${r.jilid}` : `Modul ${r.jilid}`} — Halaman {r.halaman}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border ${LEVEL_CONFIG[r.level]?.color ?? 'bg-slate-50'}`}>
                    {LEVEL_CONFIG[r.level]?.label ?? r.level}
                  </span>
                  <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {r.notes && <p className="text-xs text-slate-500 mt-2 italic">"{r.notes}"</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
