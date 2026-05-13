"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Loader2, Plus, Trash, Globe, FileText, Video, Link as LinkIcon,
  CheckCircle, AlertCircle, Save, Sparkles, Megaphone
} from "lucide-react";

export default function GuruMateriPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [classId, setClassId] = useState("");
  const [type, setType] = useState<"pdf" | "video" | "link" | "text">("pdf");
  const [isPublished, setIsPublished] = useState(true);

  const supabase = createClient();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil profile guru
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, tenant_id")
        .eq("id", user.id)
        .single();

      if (!prof) return;

      // Ambil semua kelas di tenant ini untuk drop-down pendaftaran materi
      const { data: classList } = await supabase
        .from("classes")
        .select("id, name")
        .eq("tenant_id", prof.tenant_id)
        .eq("is_active", true);

      setClasses(classList || []);

      // Ambil semua materi yang diposting oleh guru ini
      const { data: mats } = await supabase
        .from("materials")
        .select(`
          *,
          classes(name)
        `)
        .eq("guru_id", prof.id)
        .order("created_at", { ascending: false });

      setMaterials(mats || []);
    } catch (err) {
      console.error("Gagal memuat materi belajar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, tenant_id")
        .eq("id", user.id)
        .single();

      if (!prof) throw new Error("Profil guru tidak ditemukan");

      const { error } = await supabase
        .from("materials")
        .insert({
          tenant_id: prof.tenant_id,
          guru_id: prof.id,
          class_id: classId || null,
          title,
          description,
          file_url: fileUrl,
          type,
          is_published: isPublished,
        });

      if (error) throw error;

      setFeedback({ status: "success", message: "Materi belajar berhasil diterbitkan! 📚" });
      setShowForm(false);
      // Reset form
      setTitle("");
      setDescription("");
      setFileUrl("");
      setClassId("");
      setType("pdf");
      setIsPublished(true);
      loadData();
    } catch (err: any) {
      setFeedback({ status: "error", message: err.message || "Gagal menerbitkan materi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;

    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setFeedback({ status: "success", message: "Materi berhasil dihapus." });
      loadData();
    } catch (err: any) {
      setFeedback({ status: "error", message: err.message || "Gagal menghapus materi." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat materi belajar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Materi Belajar <BookOpen className="text-blue-600 h-6 w-6" />
          </h1>
          <p className="text-slate-500 mt-2">Kelola buku panduan, modul PDF, lembar kerja, atau video edukasi untuk murid Anda.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm w-fit"
        >
          <Plus size={16} />
          {showForm ? "Tutup Formulir" : "Tambah Materi"}
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
          feedback.status === "success"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-red-50 border-red-100 text-red-800"
        }`}>
          {feedback.status === "success" ? <CheckCircle className="shrink-0 text-emerald-500" /> : <AlertCircle className="shrink-0 text-red-500" />}
          <p className="text-sm font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* ── Form Tambah Materi ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" /> Buat Materi Belajar Baru
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kelas Penerima */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Ditujukan Untuk Kelas</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-bold"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Judul Materi */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Judul Materi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Modul Belajar Makhraj & Huruf Hijaiyah"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>

            {/* Tipe & Link URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Jenis Materi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-semibold"
              >
                <option value="pdf">📄 Modul / PDF</option>
                <option value="video">🎥 Video Edukasi (YouTube)</option>
                <option value="link">🔗 Link Tautan Luar</option>
                <option value="text">✏️ Teks / Catatan Pembelajaran</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Tautan / File URL</label>
              <input
                type="url"
                required={type !== "text"}
                placeholder="Contoh: https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Instruksi / Deskripsi Singkat</label>
              <textarea
                placeholder="Masukkan pesan atau instruksi belajar bagi siswa..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Terbitkan Materi Belajar
          </button>
        </form>
      )}

      {/* ── Daftar Materi Aktif ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center col-span-full">
            <Megaphone className="mx-auto h-12 w-12 text-slate-200 mb-3" />
            <p className="font-bold text-slate-500 text-sm">Belum ada materi dibagikan</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk membuat materi pembelajaran perdana Anda.</p>
          </div>
        ) : (
          materials.map((m) => (
            <div key={m.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    {m.type === "pdf" ? <FileText size={20} /> :
                     m.type === "video" ? <Video size={20} /> :
                     m.type === "link" ? <Globe size={20} /> : <FileText size={20} />}
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{m.title}</h4>
                  <p className="text-xs font-semibold text-blue-600 mt-1">{m.classes?.name ?? "Umum"}</p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{m.description || "Silakan pelajari materi berikut."}</p>
                </div>
              </div>

              {m.file_url && (
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <LinkIcon size={12} /> Buka Tautan Materi
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
