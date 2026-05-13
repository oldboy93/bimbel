"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { provisionUser, deleteUser } from "@/app/actions/provision";
import { tampilSemuaMurid, daftarkanMurid, tampilEnrollmentMurid } from "@/services/studentService";
import {
  Plus, Trash2, Phone, MapPin, Loader2, X, GraduationCap,
  BookOpen, KeyRound, Eye, EyeOff, ChevronDown
} from "lucide-react";
import type { Profile, Class, EnrollmentWithDetails } from "@/types";
import { PROGRAM_TYPES } from "@/lib/helpers";

const tenantId = process.env.NEXT_PUBLIC_TENANT_ID!;

// ── Helper generate PIN 6 digit ──────────────────────────────
const generatePin = () => String(Math.floor(100000 + Math.random() * 900000));

export default function StudentManagement() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Add form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Enroll form states
  const [selectedClassId, setSelectedClassId] = useState("");
  const [parentPin, setParentPin] = useState(generatePin());

  const supabase = createClient();

  const fetchData = async () => {
    setIsLoading(true);
    const [muridList, kelasData] = await Promise.all([
      tampilSemuaMurid(),
      supabase.from("classes").select("*").eq("is_active", true).order("name"),
    ]);
    setStudents(muridList);
    setClasses(kelasData.data ?? []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await provisionUser({ email, password: password || undefined, fullName, role: "murid", phone, address });
    if (result.success) {
      setIsAddModalOpen(false);
      setEmail(""); setPassword(""); setFullName(""); setPhone(""); setAddress("");
      fetchData();
    } else {
      setErrorMessage(result.error || "Gagal menambahkan murid.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Hapus akun murid ini? Semua data terkait akan ikut terhapus.")) return;
    const result = await deleteUser(id, "murid");
    if (result.success) fetchData();
    else alert(result.error);
  };

  const openEnrollModal = (student: Profile) => {
    setSelectedStudent(student);
    setSelectedClassId(classes[0]?.id ?? "");
    setParentPin(generatePin());
    setIsEnrollModalOpen(true);
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClassId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await daftarkanMurid(selectedStudent.id, selectedClassId, tenantId, parentPin);
      setIsEnrollModalOpen(false);
      // Refresh enrollments for the expanded student
      if (expandedStudentId === selectedStudent.id) {
        const updated = await tampilEnrollmentMurid(selectedStudent.id);
        setStudentEnrollments(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
    setIsSubmitting(false);
  };

  const toggleExpand = async (student: Profile) => {
    if (expandedStudentId === student.id) {
      setExpandedStudentId(null);
      setStudentEnrollments([]);
    } else {
      setExpandedStudentId(student.id);
      const data = await tampilEnrollmentMurid(student.id);
      setStudentEnrollments(data);
    }
  };

  const togglePinVisibility = (enrollmentId: string) => {
    setVisiblePins((prev) => ({ ...prev, [enrollmentId]: !prev[enrollmentId] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <GraduationCap className="text-blue-600 h-8 w-8" />
            Manajemen Murid
          </h1>
          <p className="text-slate-500 mt-1">Kelola data murid dan pendaftaran kelas (enrollment).</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 active:scale-95">
          <Plus size={20} />
          Tambah Murid Baru
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <GraduationCap size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-950">Belum Ada Murid</h3>
          <p className="text-slate-500 text-sm mt-2">Tambahkan murid pertama untuk memulai enrollment ke kelas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
              {/* Card Header */}
              <div className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm">
                    {student.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{student.full_name}</h3>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-sm text-slate-500">
                      {student.phone && <span className="flex items-center gap-1"><Phone size={12} />{student.phone}</span>}
                      {student.address && <span className="flex items-center gap-1"><MapPin size={12} /><span className="truncate max-w-[160px]">{student.address}</span></span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEnrollModal(student)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-xl transition">
                    <BookOpen size={14} />
                    Daftar Kelas
                  </button>
                  <button onClick={() => toggleExpand(student)}
                    className={`p-2 rounded-xl text-slate-400 hover:bg-slate-50 transition ${expandedStudentId === student.id ? "rotate-180" : ""}`}>
                    <ChevronDown size={20} className="transition-transform" />
                  </button>
                  <button onClick={() => handleDeleteStudent(student.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded Enrollments */}
              {expandedStudentId === student.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Kelas yang Diikuti:</h4>
                  {studentEnrollments.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Murid ini belum terdaftar di kelas manapun.</p>
                  ) : (
                    <div className="space-y-2">
                      {studentEnrollments.map((enr) => {
                        const prog = PROGRAM_TYPES[(enr.classes?.type ?? "umum") as keyof typeof PROGRAM_TYPES];
                        const isPinVisible = visiblePins[enr.id] ?? false;
                        return (
                          <div key={enr.id} className="bg-white rounded-xl px-4 py-3 border border-slate-100 flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{prog?.icon}</span>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{enr.classes?.name}</p>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  enr.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                }`}>{enr.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                                <KeyRound size={12} className="text-amber-600" />
                                <span className="text-xs font-mono font-bold text-amber-700">
                                  {isPinVisible ? enr.parent_pin : "••••••"}
                                </span>
                                <button onClick={() => togglePinVisibility(enr.id)} className="text-amber-500 hover:text-amber-700 transition">
                                  {isPinVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Murid */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Registrasi Murid Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">{errorMessage}</div>}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap Murid</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama murid..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@bimbel.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Bimbel123!"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">No. HP Wali Murid</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxxx"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Alamat murid..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan & Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Enrollment ke Kelas */}
      {isEnrollModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Daftarkan ke Kelas</h2>
                <p className="text-sm text-slate-500 mt-0.5">Murid: <span className="font-semibold text-blue-600">{selectedStudent.full_name}</span></p>
              </div>
              <button onClick={() => setIsEnrollModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">{errorMessage}</div>}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Kelas</label>
                {classes.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-sm text-amber-700 font-medium">
                    Belum ada kelas aktif. Tambahkan kelas dulu di menu Manajemen Kelas.
                  </div>
                ) : (
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white">
                    {classes.map((k) => (
                      <option key={k.id} value={k.id}>{k.name} ({k.type})</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  PIN Wali Murid <span className="text-slate-400 font-normal">(dibagikan ke orang tua)</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 border border-amber-200 bg-amber-50 rounded-xl">
                    <KeyRound size={16} className="text-amber-600 shrink-0" />
                    <span className="font-mono font-bold text-amber-700 text-lg tracking-widest">{parentPin}</span>
                  </div>
                  <button type="button" onClick={() => setParentPin(generatePin())}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition">
                    Acak
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">📌 Simpan PIN ini. Orang tua perlu memasukkan PIN untuk melihat catatan guru.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEnrollModalOpen(false)} className="px-5 py-3 text-slate-500 hover:bg-slate-50 font-semibold rounded-xl transition">Batal</button>
                <button type="submit" disabled={isSubmitting || classes.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Daftarkan ke Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
