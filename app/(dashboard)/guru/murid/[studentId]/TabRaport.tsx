"use client";

/**
 * TabRaport.tsx
 * Tab input raport untuk guru — di halaman detail murid.
 * Guru bisa membuat raport baru, mengisinya, menyimpan sebagai draft,
 * dan mempublikasikan ke murid/orang tua dengan tanda tangan terintegrasi.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, FileText, Send, Eye, EyeOff, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Trash2, X, Check, AlertCircle, PenTool
} from "lucide-react";
import { Format } from "@/lib/helpers";
import type { RaportEntry, RaportDataCalistung, RaportDataTahfidz, NilaiLevel } from "@/types/raport";
import { NILAI_LABEL } from "@/types/raport";

// Props
interface TabRaportProps {
  enrollmentId: string;
  guruId:       string;
  classType:    "calistung" | "tahfidz" | "umum";
}

// ── Helper: pilih level ──────────────────────────────────────────────────────
const LEVELS: NilaiLevel[] = ["belum", "mulai", "berkembang", "baik", "sangat_baik"];

function LevelSelect({
  value, onChange, label
}: { value: NilaiLevel; onChange: (v: NilaiLevel) => void; label: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as NilaiLevel)}
        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-blue-400"
      >
        {LEVELS.map(l => (
          <option key={l} value={l}>{NILAI_LABEL[l].label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Default values ─────────────────────────────────────────────────────────
const defaultCalistung = (): RaportDataCalistung => ({
  membaca_gambar: "belum", membaca_kalimat: "belum", kalimat_sederhana: "belum",
  huruf_kapital: "belum", intonasi_membaca: "belum", mengeja_suku_kata: "belum",
  tanda_baca: "belum", cara_memegang_alat: "belum", huruf_besar_kecil: "belum",
  menulis_kalimat: "belum", bilangan_puluhan: "belum", penjumlahan_pengurangan: "belum",
  narasi_guru: "", rekomendasi: "",
});

const defaultTahfidz = (): RaportDataTahfidz => ({
  hafalan_entries: [],
  tajwid_makhraj: "belum", tajwid_kelancaran: "belum",
  tajwid_kefasihan: "belum", adab_belajar: "belum",
  narasi_guru: "", rekomendasi: "",
});

// ── Form Calistung ─────────────────────────────────────────────────────────
function FormCalistung({ data, onChange }: { data: RaportDataCalistung; onChange: (d: RaportDataCalistung) => void }) {
  const set = (key: keyof RaportDataCalistung) => (v: NilaiLevel | string) =>
    onChange({ ...data, [key]: v });

  return (
    <div className="space-y-5">
      <div className="bg-blue-50/50 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-3">📖 Target Membaca</p>
        <LevelSelect label="Membaca gambar" value={data.membaca_gambar} onChange={set("membaca_gambar") as (v: NilaiLevel) => void} />
        <LevelSelect label="Membaca kalimat" value={data.membaca_kalimat} onChange={set("membaca_kalimat") as (v: NilaiLevel) => void} />
        <LevelSelect label="Kalimat sederhana" value={data.kalimat_sederhana} onChange={set("kalimat_sederhana") as (v: NilaiLevel) => void} />
        <LevelSelect label="Huruf kapital" value={data.huruf_kapital} onChange={set("huruf_kapital") as (v: NilaiLevel) => void} />
        <LevelSelect label="Intonasi membaca" value={data.intonasi_membaca} onChange={set("intonasi_membaca") as (v: NilaiLevel) => void} />
        <LevelSelect label="Mengeja suku kata" value={data.mengeja_suku_kata} onChange={set("mengeja_suku_kata") as (v: NilaiLevel) => void} />
        <LevelSelect label="Mengenal tanda baca" value={data.tanda_baca} onChange={set("tanda_baca") as (v: NilaiLevel) => void} />
      </div>
      <div className="bg-indigo-50/50 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-3">✏️ Target Menulis</p>
        <LevelSelect label="Cara memegang alat tulis & jarak mata" value={data.cara_memegang_alat} onChange={set("cara_memegang_alat") as (v: NilaiLevel) => void} />
        <LevelSelect label="Menulis huruf besar dan kecil" value={data.huruf_besar_kecil} onChange={set("huruf_besar_kecil") as (v: NilaiLevel) => void} />
        <LevelSelect label="Menulis kata atau kalimat sederhana" value={data.menulis_kalimat} onChange={set("menulis_kalimat") as (v: NilaiLevel) => void} />
      </div>
      <div className="bg-emerald-50/50 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3">🔢 Target Menghitung</p>
        <LevelSelect label="Bilangan puluhan–ratusan" value={data.bilangan_puluhan} onChange={set("bilangan_puluhan") as (v: NilaiLevel) => void} />
        <LevelSelect label="Penjumlahan dan pengurangan" value={data.penjumlahan_pengurangan} onChange={set("penjumlahan_pengurangan") as (v: NilaiLevel) => void} />
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Catatan Guru</label>
          <textarea
            value={data.narasi_guru}
            onChange={e => onChange({ ...data, narasi_guru: e.target.value })}
            rows={3}
            placeholder="Tuliskan perkembangan dan catatan untuk orang tua..."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none resize-none transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Rekomendasi</label>
          <textarea
            value={data.rekomendasi}
            onChange={e => onChange({ ...data, rekomendasi: e.target.value })}
            rows={2}
            placeholder="Rekomendasi kegiatan belajar di rumah..."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none resize-none transition"
          />
        </div>
      </div>
    </div>
  );
}

// ── Form Tahfidz ─────────────────────────────────────────────────────────
function FormTahfidz({ data, onChange }: { data: RaportDataTahfidz; onChange: (d: RaportDataTahfidz) => void }) {
  const addHafalan = () => onChange({
    ...data,
    hafalan_entries: [...data.hafalan_entries, { surah_atau_materi: "", status: "dalam_proses", catatan: "" }]
  });

  const updateHafalan = (i: number, field: string, val: string) => {
    const entries = [...data.hafalan_entries];
    entries[i] = { ...entries[i], [field]: val };
    onChange({ ...data, hafalan_entries: entries });
  };

  const removeHafalan = (i: number) => {
    const entries = data.hafalan_entries.filter((_, idx) => idx !== i);
    onChange({ ...data, hafalan_entries: entries });
  };

  const set = (key: keyof RaportDataTahfidz) => (v: NilaiLevel | string) =>
    onChange({ ...data, [key]: v });

  return (
    <div className="space-y-5">
      {/* Hafalan entries */}
      <div className="bg-emerald-50/50 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">📖 Capaian Hafalan</p>
          <button
            onClick={addHafalan}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 transition"
          >
            <Plus size={12} /> Tambah
          </button>
        </div>
        {data.hafalan_entries.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">Belum ada hafalan. Klik &ldquo;Tambah&rdquo; untuk menambahkan.</p>
        )}
        <div className="space-y-2">
          {data.hafalan_entries.map((entry, i) => (
            <div key={i} className="flex gap-2 items-start bg-white rounded-xl p-2.5 border border-slate-100">
              <div className="flex-1 space-y-1.5">
                <input
                  value={entry.surah_atau_materi}
                  onChange={e => updateHafalan(i, "surah_atau_materi", e.target.value)}
                  placeholder="Surah / Materi (cth: Al-Fatihah, Juz 30)"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-400 transition"
                />
                <div className="flex gap-2">
                  <select
                    value={entry.status}
                    onChange={e => updateHafalan(i, "status", e.target.value)}
                    className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-400 flex-1"
                  >
                    <option value="lancar">Lancar</option>
                    <option value="perlu_ulang">Perlu Ulang</option>
                    <option value="dalam_proses">Dalam Proses</option>
                  </select>
                  <input
                    value={entry.catatan}
                    onChange={e => updateHafalan(i, "catatan", e.target.value)}
                    placeholder="Catatan singkat..."
                    className="flex-1 text-xs px-2.5 py-1 border border-slate-200 rounded-lg outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>
              <button onClick={() => removeHafalan(i)} className="text-rose-400 hover:text-rose-600 transition p-1 mt-0.5">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tajwid */}
      <div className="bg-teal-50/50 rounded-2xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 mb-3">🎙️ Tajwid & Adab</p>
        <LevelSelect label="Makharijul Huruf" value={data.tajwid_makhraj} onChange={set("tajwid_makhraj") as (v: NilaiLevel) => void} />
        <LevelSelect label="Kelancaran Membaca" value={data.tajwid_kelancaran} onChange={set("tajwid_kelancaran") as (v: NilaiLevel) => void} />
        <LevelSelect label="Kefasihan & Hukum Tajwid" value={data.tajwid_kefasihan} onChange={set("tajwid_kefasihan") as (v: NilaiLevel) => void} />
        <LevelSelect label="Adab & Sikap Belajar" value={data.adab_belajar} onChange={set("adab_belajar") as (v: NilaiLevel) => void} />
      </div>

      {/* Narasi */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Catatan Guru</label>
          <textarea
            value={data.narasi_guru}
            onChange={e => onChange({ ...data, narasi_guru: e.target.value })}
            rows={3}
            placeholder="Tuliskan perkembangan hafalan dan catatan untuk orang tua..."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 outline-none resize-none transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Rekomendasi</label>
          <textarea
            value={data.rekomendasi}
            onChange={e => onChange({ ...data, rekomendasi: e.target.value })}
            rows={2}
            placeholder="Rekomendasi muroja'ah di rumah..."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 outline-none resize-none transition"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main TabRaport Component ───────────────────────────────────────────────
export default function TabRaport({ enrollmentId, guruId, classType }: TabRaportProps) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [raports, setRaports] = useState<RaportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [period, setPeriod] = useState("");
  const [formData, setFormData] = useState<RaportDataCalistung | RaportDataTahfidz>(
    classType === "tahfidz" ? defaultTahfidz() : defaultCalistung()
  );

  // Signature States
  const [guruSignature, setGuruSignature] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<"select" | "draw">("draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveSignatureToProfile, setSaveSignatureToProfile] = useState(true);

  // Modern Modal UI States
  const [showPublishModal, setShowPublishModal] = useState<{ raportId: string; period: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRaports = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("report_cards")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: false });
    setRaports((data ?? []) as RaportEntry[]);
    setIsLoading(false);
  }, [enrollmentId, supabase]);

  // Load Guru Profile Signature
  useEffect(() => {
    const loadSignature = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("signature")
        .eq("id", guruId)
        .single();
      if (data?.signature) {
        setGuruSignature(data.signature);
        setSignatureMode("select");
      } else {
        setSignatureMode("draw");
      }
    };
    if (guruId) loadSignature();
  }, [guruId, supabase]);

  useEffect(() => { loadRaports(); }, [loadRaports]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveDraft = async () => {
    if (!period.trim()) {
      showToast("Isi periode raport terlebih dahulu.", "warning");
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from("report_cards").insert({
      enrollment_id: enrollmentId,
      guru_id: guruId,
      class_type: classType,
      period: period.trim(),
      data: formData,
      published_at: null,
    });
    setIsSaving(false);
    if (error) {
      showToast("Gagal menyimpan: " + error.message, "error");
      return;
    }
    showToast("Draft raport berhasil disimpan.");
    setShowForm(false);
    setPeriod("");
    setFormData(classType === "tahfidz" ? defaultTahfidz() : defaultCalistung());
    loadRaports();
  };

  // Open Publish Signature Pad Modal
  const handlePublishClick = (raportId: string, periodName: string) => {
    setShowPublishModal({ raportId, period: periodName });
  };

  // Publish and attach signature
  const handlePublishFinal = async () => {
    if (!showPublishModal) return;
    const { raportId } = showPublishModal;

    let finalSignature = "";

    if (signatureMode === "select") {
      if (!guruSignature) {
        showToast("Tanda tangan terdaftar tidak ditemukan.", "error");
        return;
      }
      finalSignature = guruSignature;
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Check if canvas is empty
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (canvas.toDataURL() === tempCanvas.toDataURL()) {
        showToast("Tanda tangan baru kosong. Silakan gambar di pad terlebih dahulu.", "warning");
        return;
      }
      
      finalSignature = canvas.toDataURL("image/png");

      // Save to profile if checked
      if (saveSignatureToProfile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ signature: finalSignature })
          .eq("id", guruId);
        if (!profileError) {
          setGuruSignature(finalSignature);
        }
      }
    }

    setIsPublishing(raportId);

    // Fetch existing report card data
    const { data: raportEntry, error: fetchError } = await supabase
      .from("report_cards")
      .select("data")
      .eq("id", raportId)
      .single();

    if (fetchError || !raportEntry) {
      showToast("Gagal memuat detail data raport.", "error");
      setIsPublishing(null);
      return;
    }

    // Embed signature directly inside the report card data column
    const updatedData = {
      ...raportEntry.data,
      signature: finalSignature
    };

    const { error } = await supabase
      .from("report_cards")
      .update({
        published_at: new Date().toISOString(),
        data: updatedData
      })
      .eq("id", raportId);

    setIsPublishing(null);
    setShowPublishModal(null);

    if (error) {
      showToast("Gagal mempublikasikan: " + error.message, "error");
      return;
    }

    showToast("Raport resmi berhasil ditandatangani & dipublikasikan!", "success");
    loadRaports();
  };

  const handleDeleteClick = (raportId: string) => {
    setShowDeleteModal(raportId);
  };

  const handleDeleteFinal = async () => {
    if (!showDeleteModal) return;
    const raportId = showDeleteModal;

    const { error } = await supabase.from("report_cards").delete().eq("id", raportId);
    setShowDeleteModal(null);

    if (error) {
      showToast("Gagal menghapus draft: " + error.message, "error");
      return;
    }

    showToast("Draft raport berhasil dihapus.");
    loadRaports();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Toast Overlay */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[9999] animate-bounce">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white border border-opacity-10 ${
            toast.type === "success" ? "bg-slate-900 border-slate-800 shadow-slate-100" :
            toast.type === "error" ? "bg-rose-600 border-rose-500 shadow-rose-100" :
            "bg-amber-500 border-amber-400 shadow-amber-100"
          }`}>
            {toast.type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "warning" && <AlertCircle size={16} />}
            <span className="text-xs font-bold leading-none">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-85 text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Raport Murid</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Buat, simpan draft, dan publikasikan raport resmi ke orang tua.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-200"
          >
            <Plus size={14} /> Buat Raport
          </button>
        )}
      </div>

      {/* Form Buat Raport */}
      {showForm && (
        <div className="bg-white border border-blue-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <FileText size={15} className="text-blue-600" /> Raport Baru
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{classType}</span>
            </h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold transition">
              Batal
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Periode Raport *
            </label>
            <input
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="Contoh: Mei 2026 / Semester 1 2025–2026"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none transition"
            />
          </div>

          {classType === "tahfidz" ? (
            <FormTahfidz data={formData as RaportDataTahfidz} onChange={d => setFormData(d)} />
          ) : (
            <FormCalistung data={formData as RaportDataCalistung} onChange={d => setFormData(d)} />
          )}

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {isSaving ? "Menyimpan..." : "Simpan sebagai Draft"}
          </button>
        </div>
      )}

      {/* Daftar Raport */}
      {raports.length === 0 && !showForm ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center text-slate-400">
          <FileText className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="font-bold text-sm text-slate-500">Belum ada raport</p>
          <p className="text-xs mt-1 font-semibold">Klik &ldquo;Buat Raport&rdquo; untuk membuat raport pertama.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {raports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${r.published_at ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {r.published_at ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <Clock size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-800">{r.period}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {r.published_at
                        ? `Dipublikasikan ${Format.tanggalIndo(r.published_at)}`
                        : `Draft — Dibuat ${Format.tanggalIndo(r.created_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!r.published_at && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); handlePublishClick(r.id, r.period); }}
                        disabled={isPublishing === r.id}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                      >
                        {isPublishing === r.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                        Publikasi
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteClick(r.id); }}
                        className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  {r.published_at && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Eye size={10} /> Publik
                    </span>
                  )}
                  {expandedId === r.id ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-slate-50 p-4 bg-slate-50/30">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    {r.published_at ? (
                      <><Eye size={12} className="text-emerald-600" /> Raport ini sudah dipublikasikan dan dapat dilihat oleh murid/orang tua.</>
                    ) : (
                      <><EyeOff size={12} className="text-slate-400" /> Raport ini masih draft. Klik &ldquo;Publikasi&rdquo; untuk menandatangani & mengirimkan ke murid/orang tua.</>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Tanda Tangan & Publikasi ── */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <PenTool size={16} className="text-blue-600" /> Tanda Tangani Raport
              </h4>
              <button onClick={() => setShowPublishModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100/50">
                <p className="text-xs text-blue-800 font-semibold leading-relaxed">
                  Anda akan mempublikasikan raport periode <strong className="font-extrabold text-blue-900">{showPublishModal.period}</strong>.
                  Raport yang telah dipublikasikan akan langsung dapat diunduh oleh murid/orang tua dan tidak dapat diedit kembali.
                </p>
              </div>

              {guruSignature ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Pilihan Tanda Tangan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSignatureMode("select")}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition text-center ${
                        signatureMode === "select"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 font-extrabold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      Gunakan Terdaftar
                    </button>
                    <button
                      onClick={() => { setSignatureMode("draw"); setTimeout(clearCanvas, 100); }}
                      className={`py-3 px-4 text-xs font-bold rounded-2xl border transition text-center ${
                        signatureMode === "draw"
                          ? "border-blue-600 bg-blue-50/50 text-blue-700 font-extrabold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-semibold"
                      }`}
                    >
                      Buat Baru
                    </button>
                  </div>
                </div>
              ) : null}

              {signatureMode === "select" && guruSignature && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Preview Tanda Tangan Terdaftar</label>
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100 h-40">
                    <img src={guruSignature} alt="Tanda Tangan Terdaftar" className="max-h-32 object-contain" />
                  </div>
                </div>
              )}

              {(!guruSignature || signatureMode === "draw") && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Gambar Tanda Tangan Anda</label>
                    <button
                      onClick={clearCanvas}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition"
                    >
                      Bersihkan Pad
                    </button>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative h-40 cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="absolute inset-0 w-full h-full bg-white touch-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="save-sig"
                      checked={saveSignatureToProfile}
                      onChange={(e) => setSaveSignatureToProfile(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 h-4 w-4"
                    />
                    <label htmlFor="save-sig" className="text-xs text-slate-500 font-semibold cursor-pointer">
                      Simpan tanda tangan ini ke profil saya untuk berikutnya
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setShowPublishModal(null)}
                className="flex-1 py-3 text-xs font-bold rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handlePublishFinal}
                disabled={isPublishing !== null}
                className="flex-1 py-3 text-xs font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-100"
              >
                {isPublishing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Ttd & Publikasikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Hapus Draft ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm">Hapus Draft Raport?</h4>
                <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">Tindakan ini tidak dapat dibatalkan. Seluruh data draft raport ini akan dihapus permanen.</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteFinal}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
