"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet, Loader2, ArrowUpRight, TrendingUp, Users,
  BookOpen, Percent, Search, Download, CheckCircle, Award
} from "lucide-react";
import { Format } from "@/lib/helpers";

interface PaymentItem {
  enrollmentId: string;
  studentName: string;
  className: string;
  price: number;
  status: "paid" | "unpaid";
}

export default function OwnerKeuanganPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const supabase = createClient();

  const loadKeuangan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil data profile owner untuk mendapatkan tenant_id
      const { data: prof } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!prof?.tenant_id) return;

      // Ambil semua enrollment di tenant tersebut beserta data kelas & profil siswa
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          profiles!enrollments_student_id_fkey(full_name),
          classes(name, price)
        `)
        .eq("tenant_id", prof.tenant_id);

      if (enrollments) {
        const list: PaymentItem[] = enrollments.map((e: any) => {
          // Status active = Lunas (paid), status suspended atau status lainnya = Belum Bayar (unpaid)
          const isPaid = e.status === "active";
          return {
            enrollmentId: e.id,
            studentName: e.profiles?.full_name ?? "Murid",
            className: e.classes?.name ?? "Kelas Umum",
            price: e.classes?.price ?? 0,
            status: isPaid ? "paid" : "unpaid",
          };
        });
        setPayments(list);
      }
    } catch (err) {
      console.error("Gagal memuat keuangan owner:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeuangan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePayment = async (enrollmentId: string, currentStatus: "paid" | "unpaid") => {
    setIsUpdating(enrollmentId);
    try {
      const newStatus = currentStatus === "paid" ? "inactive" : "active";
      const { error } = await supabase
        .from("enrollments")
        .update({ status: newStatus })
        .eq("id", enrollmentId);
      if (error) {
        alert("Gagal memperbarui status pembayaran: " + error.message);
      } else {
        await loadKeuangan();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat laporan keuangan...</p>
        </div>
      </div>
    );
  }

  // Kalkulasi statistik
  const totalOmset = payments.reduce((acc, p) => acc + p.price, 0);
  const totalDiterima = payments.filter((p) => p.status === "paid").reduce((acc, p) => acc + p.price, 0);
  const totalTunggakan = payments.filter((p) => p.status === "unpaid").reduce((acc, p) => acc + p.price, 0);
  const persenTertagih = totalOmset > 0 ? Math.round((totalDiterima / totalOmset) * 100) : 0;

  // Filter list
  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Laporan Keuangan <Wallet className="text-blue-600 h-6 w-6" />
        </h1>
        <p className="text-slate-500 mt-2">Pantau pendapatan SPP bulanan, total tagihan tertagih, tunggakan siswa, dan perkiraan omset Bimbel secara real-time.</p>
      </header>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Perkiraan Omset</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{Format.rupiah(totalOmset)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-4 font-bold">
            <TrendingUp size={14} /> Target bulanan ini
          </div>
        </div>

        {/* Card Diterima */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Lunas Diterima</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{Format.rupiah(totalDiterima)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-4 font-bold">
            <CheckCircle size={14} /> Dana aman masuk
          </div>
        </div>

        {/* Card Tunggakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sisa Belum Bayar</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{Format.rupiah(totalTunggakan)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-4 font-bold">
            <Percent size={14} /> Perlu ditagih
          </div>
        </div>

        {/* Card Persen Tertagih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Efisiensi Penagihan</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{persenTertagih}%</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-4 font-bold">
            <ArrowUpRight size={14} /> Dari total murid aktif
          </div>
        </div>
      </div>

      {/* ── Filter & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {(["all", "paid", "unpaid"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                filterStatus === status
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {status === "all" ? "Semua" : status === "paid" ? "Lunas" : "Belum Bayar"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table List ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Daftar Transaksi SPP Murid</span>
          <span>💡 Tip: Klik tombol status siswa untuk langsung mengubah/flag status pembayaran</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Nama Murid</th>
                <th className="py-4 px-6">Kelas</th>
                <th className="py-4 px-6 text-right">SPP Bulanan</th>
                <th className="py-4 px-6 text-center">Status Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada data transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.enrollmentId} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-extrabold text-slate-900">{p.studentName}</td>
                    <td className="py-4 px-6 font-medium text-slate-600">{p.className}</td>
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      {Format.rupiah(p.price)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleTogglePayment(p.enrollmentId, p.status)}
                        disabled={isUpdating === p.enrollmentId}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase border transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
                          p.status === "paid"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/70"
                            : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/70"
                        }`}
                        title="Klik untuk mengubah status pembayaran siswa"
                      >
                        {isUpdating === p.enrollmentId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : p.status === "paid" ? (
                          <>
                            <CheckCircle size={13} /> Lunas
                          </>
                        ) : (
                          <>
                            <Percent size={13} /> Belum Bayar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
