"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Loader2, Plus, Trash, Globe, FileText, Video, Link as LinkIcon,
  CheckCircle, AlertCircle, Save, Sparkles, Megaphone,
  Bold, Italic, Heading2, Quote, List, Image, Edit3, Layout, Eye, X, Play, Download, ExternalLink
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
  const [type, setType] = useState<"pdf" | "video" | "link" | "text" | "artikel">("pdf");
  const [isPublished, setIsPublished] = useState(true);

  // Custom Artikel States
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [editorTab, setEditorTab] = useState<"visual" | "markdown">("visual");
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);

  const supabase = createClient();

  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("article-editor-textarea") as HTMLTextAreaElement;
    if (!textarea) {
      setDescription(prev => prev + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + (selected || suffix) + (selected ? suffix : "");
    setDescription(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected || suffix).length);
    }, 0);
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    return null;
  };

  const renderArticleContent = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return <h1 key={idx} className="text-base font-extrabold text-slate-900 mt-3 mb-1.5">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={idx} className="text-sm font-black text-slate-800 mt-2.5 mb-1.5">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-xs font-extrabold text-slate-800 mt-2 mb-1">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-blue-500 pl-3 py-1 my-2 bg-blue-50/40 rounded-r-lg text-slate-700 font-medium italic text-xs">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return <li key={idx} className="ml-4 list-disc text-xs text-slate-600 mb-0.5 leading-relaxed">{trimmed.slice(2)}</li>;
      }
      if (trimmed === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-2 font-medium">{trimmed}</p>;
    });
  };

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
          metadata: type === "artikel" ? { youtube_url: youtubeUrl } : {},
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
      setYoutubeUrl("");
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
                onChange={(e) => {
                  const newType = e.target.value as any;
                  setType(newType);
                  if (newType === "text" || newType === "artikel") {
                    setFileUrl("");
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-semibold"
              >
                <option value="pdf">📄 Modul / PDF</option>
                <option value="video">🎥 Video Edukasi (YouTube)</option>
                <option value="link">🔗 Link Tautan Luar</option>
                <option value="text">✏️ Teks / Catatan Pembelajaran</option>
                <option value="artikel">📖 Artikel Pembelajaran Baru</option>
              </select>
            </div>

            {type !== "text" && type !== "artikel" && (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Tautan / File URL</label>
                <input
                  type="url"
                  required
                  placeholder="Contoh: https://drive.google.com/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                />
              </div>
            )}

            {type === "artikel" && (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Tautan Gambar Sampul (Opsional)</label>
                <input
                  type="url"
                  placeholder="Contoh: https://images.unsplash.com/..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                />
              </div>
            )}

            {/* Live Image Preview for Cover in Article */}
            {type === "artikel" && fileUrl && (
              <div className="col-span-2 border border-slate-100 rounded-2xl overflow-hidden h-32 relative bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold bg-indigo-600/90 px-3 py-1 rounded-full">Pratinjau Gambar Sampul</span>
                </div>
              </div>
            )}

            {/* YouTube Embed URL input for Article */}
            {type === "artikel" && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Tautan Video YouTube Penunjang (Opsional)</label>
                <input
                  type="url"
                  placeholder="Contoh: https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
                />
              </div>
            )}

            {/* Content Field: Standard Textarea VS Custom Rich Editor for Article */}
            {type !== "artikel" ? (
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
            ) : (
              <div className="col-span-2 space-y-3">
                <div className="flex justify-between items-center bg-slate-100 p-1 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => setEditorTab("visual")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      editorTab === "visual"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Edit3 size={12} /> Mode Editor Visual (WYSIWYG)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("markdown")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      editorTab === "markdown"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Layout size={12} /> Mode Editor Markdown
                  </button>
                </div>

                {/* Toolbar Visual Formatting (Available in both modes to aid formatting!) */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => insertFormat("**", "**")}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    title="Tebal (Bold)"
                  >
                    <Bold size={12} /> Tebal
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("*", "*")}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs italic flex items-center gap-1 transition"
                    title="Miring (Italic)"
                  >
                    <Italic size={12} /> Miring
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("## ", "\n")}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    title="Judul Seksi"
                  >
                    <Heading2 size={12} /> Judul
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("> ", "\n")}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    title="Kutipan Penting"
                  >
                    <Quote size={12} /> Kutipan
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("* ", "\n")}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    title="Daftar Poin"
                  >
                    <List size={12} /> Poin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Masukkan URL Gambar:");
                      if (url) insertFormat(`\n![Deskripsi Gambar](${url})\n`);
                    }}
                    className="px-2.5 py-1.5 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    title="Sisipkan Gambar"
                  >
                    <Image size={12} /> Gambar
                  </button>
                </div>

                {/* Editor Content Input Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={editorTab === "visual" ? "col-span-2 animate-fade-in" : "col-span-1 animate-fade-in"}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      {editorTab === "visual" ? "Tulis Isi Artikel Anda" : "Kode Sumber Markdown"}
                    </label>
                    <textarea
                      id="article-editor-textarea"
                      required
                      placeholder="Tulis artikel pembelajaran secara lengkap di sini. Gunakan tombol pemformatan di atas untuk mempercantik isi..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium font-sans leading-relaxed"
                    />
                  </div>

                  {/* Live Preview Pane for Markdown Tab */}
                  {editorTab === "markdown" && (
                    <div className="col-span-1 border border-slate-200 rounded-xl p-4 bg-slate-50 overflow-y-auto max-h-[250px] space-y-1 animate-fade-in">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block border-b border-indigo-100 pb-1.5 mb-2">Pratinjau Langsung Markdown</span>
                      {description ? renderArticleContent(description) : (
                        <p className="text-xs text-slate-400 italic">Mulai menulis untuk melihat pratinjau...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Instant Visual Reader Mockup below in WYSIWYG Mode */}
                {editorTab === "visual" && (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 animate-fade-in">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block border-b border-emerald-100 pb-1.5">
                      👁️ PRATINJAU TAMPILAN ARTIKEL (YANG AKAN DILIHAT MURID)
                    </span>
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{title || "Judul Artikel"}</h3>
                      <div className="space-y-1">
                        {description ? renderArticleContent(description) : (
                          <p className="text-xs text-slate-400 italic">Isi artikel Anda akan terformat di sini secara real-time...</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
          materials.map((m) => {
            const isVideo = m.type === "video";
            const isPdf = m.type === "pdf";
            const isArtikel = m.type === "artikel";
            return (
              <div key={m.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`p-3 rounded-2xl ${
                      isPdf ? "bg-emerald-50 text-emerald-600" :
                      isVideo ? "bg-rose-50 text-rose-600" :
                      isArtikel ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {isPdf ? <FileText size={20} /> :
                       isVideo ? <Video size={20} /> :
                       isArtikel ? <BookOpen size={20} /> : <Globe size={20} />}
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
                    <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1.5">
                      <span>{m.classes?.name ?? "Umum"}</span>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                        {m.type === "artikel" ? "Artikel" : m.type}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{m.description || "Silakan pelajari materi berikut."}</p>
                  </div>
                </div>

                {isArtikel ? (
                  <button
                    onClick={() => setSelectedMaterial(m)}
                    className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye size={12} /> Buka Pratinjau Artikel
                  </button>
                ) : m.file_url ? (
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <LinkIcon size={12} /> Buka Tautan Materi
                  </a>
                ) : null}
              </div>
            );
          })
        )}
      </div>
      {/* ── LMS PREMIUM MATERIAL VIEWER OVERLAY MODAL ── */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-wider ${
                    selectedMaterial.type === "video" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                    selectedMaterial.type === "pdf" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}>
                    {selectedMaterial.type}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Pembelajaran Mandiri</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-snug">{selectedMaterial.title}</h2>
                {selectedMaterial.description && (
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed mt-1">{selectedMaterial.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              
              {/* VIDEO PLAYER EMBED */}
              {selectedMaterial.type === "video" && (
                <div className="space-y-4">
                  {getYoutubeEmbedUrl(selectedMaterial.file_url || "") ? (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-black">
                      <iframe
                        src={getYoutubeEmbedUrl(selectedMaterial.file_url || "")!}
                        title={selectedMaterial.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center space-y-3">
                      <Video className="h-12 w-12 text-slate-400 mx-auto" />
                      <p className="font-bold text-slate-700">Tautan Video Edukasi</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">Tautan ini bukan tautan embed YouTube langsung. Silakan klik tombol di bawah untuk memutar di platform eksternal.</p>
                      <a
                        href={selectedMaterial.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition"
                      >
                        <ExternalLink size={14} /> Buka Pemutar Eksternal
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* PDF DOCUMENT EMBED */}
              {selectedMaterial.type === "pdf" && (
                <div className="space-y-4">
                  <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 relative">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedMaterial.file_url || "")}&embedded=true`}
                      title={selectedMaterial.title}
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* EXTERNAL LINK DASHBOARD */}
              {selectedMaterial.type === "link" && (
                <div className="p-8 text-center max-w-lg mx-auto space-y-5">
                  <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <Globe size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-slate-900 text-lg">Referensi Tambahan Eksternal</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Materi belajar ini merujuk pada artikel atau situs pembelajaran luar yang direkomendasikan langsung oleh Ustadz/Ustadzah pengampu kelas Anda.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tautan URL Resmi</span>
                    <p className="text-xs font-semibold text-blue-600 break-all">{selectedMaterial.file_url}</p>
                  </div>
                  <a
                    href={selectedMaterial.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition w-full shadow-md shadow-blue-500/10"
                  >
                    Kunjungi Situs Belajar Resmi <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* PLAIN TEXT / NOTE LESSON */}
              {selectedMaterial.type === "text" && (
                <div className="prose max-w-none p-4 text-slate-700 leading-relaxed space-y-4">
                  <p className="whitespace-pre-line text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100 font-medium">
                    {selectedMaterial.description || "Silakan baca instruksi yang diberikan oleh guru Anda."}
                  </p>
                </div>
              )}

              {/* ARTIKEL / RICH LESSON READER MODE */}
              {selectedMaterial.type === "artikel" && (
                <div className="space-y-6 animate-fade-in">
                  {/* Parallax/Banner Cover Image */}
                  {selectedMaterial.file_url && (
                    <div className="w-full h-64 rounded-2xl overflow-hidden shadow-md relative border border-slate-100 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedMaterial.file_url}
                        alt="Sampul Artikel"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-5">
                        <div className="text-white">
                          <span className="text-[10px] bg-indigo-600/90 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                            Artikel Pembelajaran
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Video Embed Card if present in metadata */}
                  {selectedMaterial.metadata && (selectedMaterial.metadata as any).youtube_url && getYoutubeEmbedUrl((selectedMaterial.metadata as any).youtube_url) && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Video Penunjang Materi</span>
                      <div className="aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-black">
                        <iframe
                          src={getYoutubeEmbedUrl((selectedMaterial.metadata as any).youtube_url)!}
                          title={selectedMaterial.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Prose Rich Content Body */}
                  <div className="prose max-w-none bg-slate-50/40 rounded-2xl border border-slate-100 p-6">
                    <div className="mb-4 pb-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span>Diterbitkan oleh Anda</span>
                      <span>{new Date(selectedMaterial.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    
                    <div className="space-y-1">
                      {renderArticleContent(selectedMaterial.description || "")}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-5 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition"
              >
                Tutup Pratinjau
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
