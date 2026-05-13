"use client";
import { useEffect, useState } from "react";
import { tampilAssessmentTajwid, simpanAssessmentTajwid } from "@/services/gradeService";
import type { TajwidAssessment } from "@/types";
import { TAJWID_LEVELS } from "@/lib/helpers";
import { Loader2, Star, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props { enrollmentId: string; guruId: string; }

type Level = "mulai" | "sedang" | "lancar";
const LEVELS: Level[] = ["mulai", "sedang", "lancar"];

const ASPEK = [
  { key: "makhraj",    label: "Makhroj Huruf" },
  { key: "kelancaran", label: "Kelancaran"    },
  { key: "tajwid",     label: "Tajwid"        },
] as const;

export default function TabTajwid({ enrollmentId, guruId }: Props) {
  const [riwayat, setRiwayat] = useState<TajwidAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [makhraj, setMakhraj] = useState<Level>("mulai");
  const [makhrajNotes, setMakhrajNotes] = useState("");
  const [kelancaran, setKelancaran] = useState<Level>("mulai");
  const [kelancaranNotes, setKelancaranNotes] = useState("");
  const [tajwid, setTajwid] = useState<Level>("mulai");
  const [tajwidNotes, setTajwidNotes] = useState("");

  const db = createClient();

  const load = () => {
    tampilAssessmentTajwid(enrollmentId).then(d => { setRiwayat(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  // Smart pre-fill: Lanjutkan level makhroj/kelancaran/tajwid dari penilaian terakhir murid
  useEffect(() => {
    if (riwayat && riwayat.length > 0) {
      const latest = riwayat[0];
      setMakhraj(latest.makhraj_level as Level);
      setKelancaran(latest.kelancaran_level as Level);
      setTajwid(latest.tajwid_level as Level);
    }
  }, [riwayat]);

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus penilaian tajwid ini?")) return;
    await db.from("tajwid_assessments").delete().eq("id", id);
    load();
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await simpanAssessmentTajwid({
      enrollmentId, guruId, sessionDate,
      makhrajLevel: makhraj, makhrajNotes,
      kelancaranLevel: kelancaran, kelancaranNotes,
      tajwidLevel: tajwid, tajwidNotes,
    });
    setShowForm(false);
    load();
    setIsSaving(false);
  };

  const LevelSelector = ({ label, value, onChange }: { label: string; value: Level; onChange: (v: Level) => void }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
      <div className="flex gap-2">
        {LEVELS.map(l => {
          const cfg = TAJWID_LEVELS[l];
          return (
            <button key={l} type="button" onClick={() => onChange(l)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
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
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
        <Plus size={18} /> Input Assessment Tajwid
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-blue-100 p-5 space-y-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Penilaian Tajwid</h3>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Sesi</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <LevelSelector label="Makhroj Huruf" value={makhraj} onChange={setMakhraj} />
          <textarea value={makhrajNotes} onChange={e => setMakhrajNotes(e.target.value)} rows={2}
            placeholder="Catatan makhroj..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

          <LevelSelector label="Kelancaran" value={kelancaran} onChange={setKelancaran} />
          <textarea value={kelancaranNotes} onChange={e => setKelancaranNotes(e.target.value)} rows={2}
            placeholder="Catatan kelancaran..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

          <LevelSelector label="Tajwid" value={tajwid} onChange={setTajwid} />
          <textarea value={tajwidNotes} onChange={e => setTajwidNotes(e.target.value)} rows={2}
            placeholder="Catatan tajwid..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 text-slate-500 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition">Batal</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {/* Riwayat Assessment */}
      <div className="space-y-3">
        {riwayat.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            <Star className="mx-auto mb-2 text-slate-300" size={32} />
            <p>Belum ada penilaian tajwid.</p>
          </div>
        ) : riwayat.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-slate-400">
                {new Date(r.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <button onClick={() => handleHapus(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition -mt-1.5 -mr-1.5">
                <Trash2 size={14} />
              </button>
            </div>
            {[
              { label: "Makhroj", level: r.makhraj_level, note: r.makhraj_notes },
              { label: "Kelancaran", level: r.kelancaran_level, note: r.kelancaran_notes },
              { label: "Tajwid", level: r.tajwid_level, note: r.tajwid_notes },
            ].map(a => {
              const cfg = TAJWID_LEVELS[a.level as Level];
              return (
                <div key={a.label} className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-700 w-24 shrink-0">{a.label}</span>
                  <div className="flex-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    {a.note && <p className="text-xs text-slate-400 mt-1 italic">"{a.note}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
