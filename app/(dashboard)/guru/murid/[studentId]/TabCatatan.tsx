"use client";
import { useEffect, useState } from "react";
import { tampilCatatan, simpanCatatan, hapusCatatan, toggleVisibilitasCatatan } from "@/services/notesService";
import type { TeacherNote } from "@/types";
import { Loader2, MessageSquare, Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface Props { enrollmentId: string; guruId: string; }

export default function TabCatatan({ enrollmentId, guruId }: Props) {
  const [catatan, setCatatan] = useState<TeacherNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split("T")[0]);

  const load = () => {
    tampilCatatan(enrollmentId).then(d => { setCatatan(d); setIsLoading(false); });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSaving(true);
    await simpanCatatan({ enrollmentId, guruId, noteDate, content, isVisibleToWali: isVisible });
    setContent(""); setIsVisible(true);
    load();
    setIsSaving(false);
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    await hapusCatatan(id);
    load();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await toggleVisibilitasCatatan(id, !current);
    load();
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Form Input */}
      <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Plus size={18} className="text-blue-600" /> Tambah Catatan Baru
        </h3>
        <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={3}
          required placeholder="Tulis catatan evaluasi, perkembangan, atau pesan untuk wali murid..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" />
        <button type="button" onClick={() => setIsVisible(!isVisible)}
          className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl transition ${
            isVisible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
          {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
          {isVisible ? "Terlihat oleh Wali Murid" : "Disembunyikan dari Wali"}
        </button>
        <button type="submit" disabled={isSaving || !content.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan Catatan"}
        </button>
      </form>

      {/* Daftar Catatan */}
      <div className="space-y-3">
        {catatan.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            <MessageSquare className="mx-auto mb-2 text-slate-300" size={32} />
            <p>Belum ada catatan untuk murid ini.</p>
          </div>
        ) : catatan.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex justify-between items-start gap-2 mb-2">
              <p className="text-xs text-slate-400">
                {new Date(c.note_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggle(c.id, c.is_visible_to_wali)}
                  title={c.is_visible_to_wali ? "Sembunyikan dari Wali" : "Tampilkan ke Wali"}
                  className={`p-1.5 rounded-lg transition ${c.is_visible_to_wali ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-slate-300 bg-slate-50 hover:bg-slate-100"}`}>
                  {c.is_visible_to_wali ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => handleHapus(c.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{c.content}</p>
            <div className="mt-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.is_visible_to_wali ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                {c.is_visible_to_wali ? "👀 Terlihat Wali" : "🔒 Tersembunyi"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
