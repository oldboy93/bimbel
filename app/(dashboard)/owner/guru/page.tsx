"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { provisionUser, deleteUser, updateUser, getStudentEmails } from "@/app/actions/provision";
import { Plus, Trash2, Mail, Phone, MapPin, Loader2, X, Users, Pencil } from "lucide-react";

interface Teacher {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  email?: string;
}

export default function GuruManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Edit form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  const supabase = createClient();

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      // Ambil profile guru
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "guru")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTeachers(profiles || []);

      const emailRes = await getStudentEmails();
      if (emailRes.success && emailRes.emailMap) {
        setEmailMap(emailRes.emailMap);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openEditModal = (teacher: Teacher) => {
    setEditUserId(teacher.id);
    setEditFullName(teacher.full_name);
    setEditPhone(teacher.phone || "");
    setEditAddress(teacher.address || "");
    setEditPassword("");
    setEditEmail(emailMap[teacher.id] || "");
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await updateUser({
      userId: editUserId,
      fullName: editFullName,
      phone: editPhone,
      address: editAddress,
      email: editEmail,
      password: editPassword || undefined,
      role: "guru"
    });
    if (result.success) {
      setIsEditModalOpen(false);
      fetchTeachers();
    } else {
      setErrorMessage(result.error || "Gagal memperbarui data guru.");
    }
    setIsSubmitting(false);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await provisionUser({
      email,
      password: password || undefined,
      fullName,
      role: "guru",
      phone,
      address,
    });

    if (result.success) {
      setIsModalOpen(false);
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setAddress("");
      // Refresh list
      fetchTeachers();
    } else {
      setErrorMessage(result.error || "Gagal menambahkan guru.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus akun guru ini? Semua data terkait (presensi, hafalan) juga akan ikut terhapus.")) return;

    try {
      const result = await deleteUser(id, "guru");
      if (result.success) {
        fetchTeachers();
      } else {
        alert(result.error || "Gagal menghapus guru.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600 h-8 w-8" />
            Manajemen Guru
          </h1>
          <p className="text-slate-500 mt-1">Daftar guru yang aktif mengajar Calistung & Tahfidz.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95"
        >
          <Plus size={20} />
          Tambah Guru Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Belum Ada Guru</h3>
          <p className="text-slate-500 text-sm mt-2">
            Mulai tambahkan pengajar pertama untuk mengelola absensi dan pencapaian hafalan murid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start hover:shadow-md transition">
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{teacher.full_name}</h3>
                  {emailMap[teacher.id] && (
                    <span className="text-xs font-normal text-slate-400 block mb-1">({emailMap[teacher.id]})</span>
                  )}
                  <span className="inline-block mt-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-lg">
                    Aktif Mengajar
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-slate-500">
                  {teacher.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {teacher.phone}
                    </p>
                  )}
                  {teacher.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      {teacher.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(teacher)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition"
                  title="Ubah Data Guru"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTeacher(teacher.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                  title="Hapus Guru"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in / Pop-up Custom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Registrasi Akun Guru Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ustadz / Ustadzah..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Akun</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@bimbel.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password (Opsional)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Bimbel123! (bawaan)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat tempat tinggal guru..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan & Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Edit Guru */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Ubah Data Guru</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateTeacher} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Ustadz / Ustadzah..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Akun</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="nama@bimbel.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Alamat tempat tinggal guru..."
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ubah Password <span className="text-slate-400 font-normal">(kosongkan jika tidak ingin diubah)</span></label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Password baru..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
