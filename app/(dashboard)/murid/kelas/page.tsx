"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Calendar, Clock, Loader2, FileText, Download,
  ExternalLink, MessageSquare, AlertCircle, Sparkles, BookMarked,
  X, Play, Globe, Eye, ArrowRight, Lock, Unlock
} from "lucide-react";
import { tampilEnrollmentMurid, verifikasiPinWali } from "@/services/studentService";
import { tampilCatatanUntukWali } from "@/services/notesService";
import { DAY_NAMES, Format, PROGRAM_TYPES } from "@/lib/helpers";
import type { EnrollmentWithDetails, TeacherNote, Material } from "@/types";

// Helper function to extract and build YouTube embed URL
function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
}

function renderArticleContent(content: string) {
  if (!content) return null;
  const lines = content.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return <h1 key={idx} className="text-xl font-extrabold text-slate-900 mt-4 mb-2">{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={idx} className="text-lg font-black text-slate-800 mt-3 mb-2">{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith("### ")) {
      return <h3 key={idx} className="text-base font-extrabold text-slate-800 mt-3 mb-1.5">{trimmed.slice(4)}</h3>;
    }
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-4 border-blue-500 pl-4 py-1.5 my-3 bg-blue-50/40 rounded-r-xl text-slate-700 font-medium italic text-sm">
          {trimmed.slice(2)}
        </blockquote>
      );
    }
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      return <li key={idx} className="ml-5 list-disc text-sm text-slate-600 mb-1 leading-relaxed">{trimmed.slice(2)}</li>;
    }
    if (trimmed === "") {
      return <div key={idx} className="h-2" />;
    }
    return <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2.5 font-medium">{trimmed}</p>;
  });
}


export default function MuridKelasPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [selectedEnr, setSelectedEnr] = useState<EnrollmentWithDetails | null>(null);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeTab, setActiveTab] = useState<"jadwal" | "materi" | "catatan">("jadwal");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  
  // State for the LMS Material Viewer Modal
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  // Modern PIN Wali Murid Verification State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePinChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const newDigits = [...pinDigits];
    
    // Handle pasting or multi-character entry
    if (val.length > 1) {
      const pastedDigits = val.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedDigits[i] || "";
      }
      setPinDigits(newDigits);
      const focusIndex = Math.min(val.length - 1, 5);
      const nextInput = document.getElementById(`pin-${focusIndex}`);
      nextInput?.focus();
      return;
    }

    newDigits[index] = val;
    setPinDigits(newDigits);
    setPinError("");

    // Auto-focus next field
    if (val && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
      const newDigits = [...pinDigits];
      newDigits[index - 1] = "";
      setPinDigits(newDigits);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setPinDigits(newDigits);
    setPinError("");

    const lastIdx = Math.min(pastedData.length - 1, 5);
    const targetInput = document.getElementById(`pin-${lastIdx}`);
    targetInput?.focus();
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnr) return;
    const pinString = pinDigits.join("");
    if (pinString.length < 6) {
      setPinError("Masukkan 6 digit PIN secara lengkap.");
      return;
    }
    setIsVerifying(true);
    setPinError("");
    try {
      const isValid = await verifikasiPinWali(selectedEnr.id, pinString);
      if (isValid) {
        setIsUnlocked(true);
      } else {
        setPinError("PIN yang Anda masukkan salah. Silakan coba lagi.");
        setPinDigits(["", "", "", "", "", ""]);
        document.getElementById("pin-0")?.focus();
      }
    } catch (err) {
      setPinError("Terjadi kesalahan sistem saat memvalidasi PIN.");
    } finally {
      setIsVerifying(false);
    }
  };

  const supabase = createClient();

  // Load enrollments
  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const enrData = await tampilEnrollmentMurid(user.id);
        setEnrollments(enrData);
        if (enrData.length > 0) {
          setSelectedEnr(enrData[0]);
        }
      } catch (err) {
        console.error("Gagal memuat enrollment kelas:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEnrollments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load notes & materials when selected enrollment changes
  useEffect(() => {
    if (!selectedEnr) return;
    setIsUnlocked(false);
    setPinDigits(["", "", "", "", "", ""]);
    setPinError("");

    const loadSubData = async () => {
      setIsSubLoading(true);
      try {
        const [notesData, { data: materialsData }] = await Promise.all([
          tampilCatatanUntukWali(selectedEnr.id).catch(() => []),
          supabase
            .from("materials")
            .select("*")
            .eq("class_id", selectedEnr.class_id)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
        ]);

        setNotes(notesData);
        setMaterials(materialsData || []);
      } catch (err) {
        console.error("Gagal memuat sub-data kelas:", err);
      } finally {
        setIsSubLoading(false);
      }
    };

    loadSubData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnr]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm font-semibold">Memuat data kelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Kelas Saya <Sparkles className="text-blue-600 h-6 w-6" />
        </h1>
        <p className="text-slate-500 mt-2">Pilih kelas Anda untuk melihat jadwal belajar, materi yang dibagikan, dan catatan dari Ustadz/Ustadzah.</p>
      </header>

      {/* ── Selektor Kelas (Jika murid punya > 1 kelas) ── */}
      {enrollments.length > 1 && (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {enrollments.map((enr) => (
            <button
              key={enr.id}
              onClick={() => setSelectedEnr(enr)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                selectedEnr?.id === enr.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {enr.classes?.name ?? "Kelas"}
            </button>
          ))}
        </div>
      )}

      {/* ── Konten Utama Kelas ── */}
      {!selectedEnr ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Kamu belum memiliki kelas aktif</p>
            <p className="text-sm text-amber-700 mt-1">Silakan hubungi admin atau ustadz untuk mendaftarkan kamu ke kelas belajar.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Profil Kelas */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl bg-blue-50 p-3 rounded-2xl">
                  {selectedEnr.classes?.type ? PROGRAM_TYPES[selectedEnr.classes.type]?.icon : "📚"}
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                    {selectedEnr.classes?.name ?? "-"}
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    {selectedEnr.classes?.type ? PROGRAM_TYPES[selectedEnr.classes.type]?.label : selectedEnr.classes?.type}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Deskripsi Kelas</span>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {selectedEnr.classes?.description || "Tidak ada deskripsi untuk kelas ini."}
                  </p>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 text-xs">Tanggal Terdaftar</span>
                  <span className="text-slate-700 font-bold text-xs">
                    {Format.tanggalIndo(selectedEnr.enrolled_at)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 text-xs">Status Belajar</span>
                  <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border border-emerald-100">
                    {selectedEnr.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Menu & List Detail */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Switches */}
            <div className="flex border-b border-slate-200">
              {(["jadwal", "materi", "catatan"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 capitalize transition ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab === "catatan" ? "Catatan Guru" : tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {isSubLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="pt-2 min-h-[300px]">
                {/* 1. JADWAL TAB */}
                {activeTab === "jadwal" && (
                  <div className="space-y-3">
                    {(selectedEnr.schedules ?? []).length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Calendar className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-semibold text-sm">Belum ada jadwal belajar</p>
                      </div>
                    ) : (
                      (selectedEnr.schedules ?? []).map((sch, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between animate-fade-in">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm w-12 h-12 flex items-center justify-center">
                              {DAY_NAMES[sch.day_of_week].slice(0, 3)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{sch.activity}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{sch.material_notes || "Murajaah & Tahsin"}</p>
                            </div>
                          </div>
                          {sch.time_start && (
                            <div className="flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-xl">
                              <Clock size={14} className="text-blue-600" />
                              <span className="text-xs font-black text-blue-600">
                                {sch.time_start.slice(0, 5)}
                                {sch.time_end ? ` – ${sch.time_end.slice(0, 5)}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. MATERI TAB — Premium Immersive Learning LMS */}
                {activeTab === "materi" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materials.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 col-span-full">
                        <FileText className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                        <p className="font-semibold text-sm">Belum ada materi belajar dibagikan</p>
                      </div>
                    ) : (
                      materials.map((m) => {
                        const isVideo = m.type === "video";
                        const isPdf = m.type === "pdf";
                        const isArtikel = m.type === "artikel";
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMaterial(m)}
                            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col justify-between animate-fade-in"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`p-3 rounded-2xl inline-block ${
                                  isVideo ? "bg-rose-50 text-rose-600" :
                                  isPdf ? "bg-emerald-50 text-emerald-600" :
                                  isArtikel ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                                }`}>
                                  {isVideo ? <Play size={20} /> :
                                   isPdf ? <FileText size={20} /> :
                                   isArtikel ? <BookOpen size={20} /> : <Globe size={20} />}
                                </span>
                                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                                  {m.type === "artikel" ? "Artikel" : m.type}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-1">{m.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{m.description || "Silakan pelajari materi berikut secara mandiri."}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMaterial(m);
                              }}
                              className="mt-4 w-full py-2 bg-slate-50 group-hover:bg-blue-600 text-slate-700 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              <Eye size={12} /> Mulai Belajar Mandiri
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 3. CATATAN TAB */}
                {activeTab === "catatan" && (
                  <div>
                    {!isUnlocked ? (
                      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm max-w-md mx-auto text-center space-y-6 animate-fade-in my-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-100/30 shadow-sm animate-pulse">
                          <Lock size={28} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-black text-slate-900 text-lg">Akses Khusus Orang Tua / Wali</h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                            Untuk melindungi privasi data evaluasi perkembangan murid, silakan masukkan 6 digit PIN Wali Murid yang diberikan lembaga.
                          </p>
                        </div>
                        <form onSubmit={handleVerifyPin} className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex justify-center gap-2.5">
                              {pinDigits.map((digit, idx) => (
                                <input
                                  key={idx}
                                  id={`pin-${idx}`}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={2}
                                  value={digit}
                                  onChange={(e) => handlePinChange(e.target.value, idx)}
                                  onKeyDown={(e) => handleKeyDown(e, idx)}
                                  onPaste={idx === 0 ? handlePaste : undefined}
                                  className="w-12 h-14 text-center text-xl font-black text-blue-600 bg-slate-50/50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-100"
                                  required
                                />
                              ))}
                            </div>
                            {pinError && (
                              <p className="text-xs font-bold text-red-500 text-center animate-shake">
                                ⚠ {pinError}
                              </p>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={isVerifying || pinDigits.some(d => !d)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 disabled:opacity-50"
                          >
                            {isVerifying ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Unlock size={16} />
                            )}
                            {isVerifying ? "Memverifikasi..." : "Buka Catatan Guru"}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notes.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <MessageSquare className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                            <p className="font-semibold text-sm">Belum ada catatan dari guru</p>
                          </div>
                        ) : (
                          notes.map((n) => (
                            <div key={n.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 animate-fade-in">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-blue-600">Ustadz/Ustadzah</span>
                                <span className="text-slate-400">{Format.tanggalIndo(n.note_date)}</span>
                              </div>
                              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                {n.content}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                      <Play className="h-12 w-12 text-slate-400 mx-auto" />
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
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                    <div className="text-left">
                      <p className="text-xs font-black text-slate-700">Tidak dapat memuat modul PDF?</p>
                      <p className="text-[11px] text-slate-500">Gunakan tautan langsung di bawah untuk mengunduh berkas materi.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <a
                        href={selectedMaterial.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 font-bold rounded-xl text-xs transition"
                      >
                        <ExternalLink size={12} /> Buka Jendela Baru
                      </a>
                      <a
                        href={selectedMaterial.file_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-emerald-500/10"
                      >
                        <Download size={12} /> Unduh Materi
                      </a>
                    </div>
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
                    Kunjungi Situs Belajar Resmi <ArrowRight size={14} />
                  </a>
                </div>
              )}

              {/* PLAIN TEXT / NOTE LESSON */}
              {selectedMaterial.type === "text" && (
                <div className="prose max-w-none p-4 text-slate-700 leading-relaxed space-y-4">
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
                    <strong>Pesan Pembelajaran Mandiri:</strong> Selesaikan instruksi pembelajaran di bawah secara mandiri dan laporkan ke Ustadz/Ustadzah saat kelas tatap muka dimulai.
                  </div>
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
                      <span>Diterbitkan oleh Guru Pembimbing</span>
                      <span>{Format.tanggalIndo(selectedMaterial.created_at)}</span>
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
                Selesai Belajar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
