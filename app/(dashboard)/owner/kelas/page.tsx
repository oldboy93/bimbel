"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, BookOpen, Loader2, X, Tag, BadgeCheck } from "lucide-react";
import type { Class } from "@/types";
import { PROGRAM_TYPES } from "@/lib/helpers";

const tenantId = process.env.NEXT_PUBLIC_TENANT_ID!;

export default function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"tahfidz" | "calistung" | "umum">("tahfidz");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const supabase = createClient();

  const fetchClasses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setClasses(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const resetForm = () => {
    setName("");
    setType("tahfidz");
    setDescription("");
    setPrice("");
    setErrorMessage(null);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from("classes").insert({
      name,
      type,
      description,
      price: parseInt(price) || 0,
      tenant_id: tenantId,
      is_active: true,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setIsModalOpen(false);
      resetForm();
      fetchClasses();
    }
    setIsSubmitting(false);
  };

  const handleToggleActive = async (kelas: Class) => {
    await supabase
      .from("classes")
      .update({ is_active: !kelas.is_active })
      .eq("id", kelas.id);
    fetchClasses();
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Hapus kelas ini? Semua enrollment terkait juga akan terhapus.")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchClasses();
  };

  const programInfo = (t: string) => PROGRAM_TYPES[t as keyof typeof PROGRAM_TYPES] ?? { label: t, icon: "📚" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-600 h-8 w-8" />
            Manajemen Kelas
          </h1>
          <p className="text-slate-500 mt-1">Kelola program Tahfidz, Calistung, dan kelas lainnya.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95"
        >
          <Plus size={20} />
          Tambah Kelas Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Belum Ada Kelas</h3>
          <p className="text-slate-500 text-sm mt-2">Tambahkan kelas/program pertama untuk memulai enrollment murid.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((kelas) => {
            const prog = programInfo(kelas.type);
            return (
              <div
                key={kelas.id}
                className={`bg-white p-6 rounded-2xl shadow-sm border transition hover:shadow-md ${
                  kelas.is_active ? "border-slate-100" : "border-dashed border-slate-300 opacity-60"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-2xl">{prog.icon}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{kelas.name}</h3>
                    <span className="inline-block mt-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg">
                      {prog.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleActive(kelas)}
                      title={kelas.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className={`p-2 rounded-xl transition ${
                        kelas.is_active
                          ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100"
                          : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <BadgeCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(kelas.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {kelas.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{kelas.description}</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Tag size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold text-blue-600">
                    {kelas.price === 0
                      ? "Gratis"
                      : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(kelas.price) + "/bulan"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Tambah Kelas / Program Baru</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelas</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Tahfidz Pagi — Kelas A"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipe Program</label>
                <select
                  value={type} onChange={(e) => setType(e.target.value as typeof type)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                >
                  <option value="tahfidz">📖 Tahfidz Al-Quran</option>
                  <option value="calistung">✏️ Calistung</option>
                  <option value="umum">📚 Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi (Opsional)</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jadwal, target, atau informasi tambahan..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Biaya SPP / Bulan (Rp)</label>
                <input
                  type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 = Gratis"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
