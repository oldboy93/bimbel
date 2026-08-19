"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Wallet, Loader2, ArrowUpRight, TrendingUp, Users,
  BookOpen, Percent, Search, Download, CheckCircle, Award,
  ChevronLeft, ChevronRight, Calendar, RotateCcw
} from "lucide-react";
import { Format } from "@/lib/helpers";

interface PaymentItem {
  enrollmentId: string;
  studentName: string;
  className: string;
  price: number;
  status: "paid" | "unpaid";
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function OwnerKeuanganPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const supabase = createClient();

  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const targetYM = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const isCurrentMonth = targetYM === currentYM;

  const loadKeuangan = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!prof?.tenant_id) return;

      // 1. Ambil semua enrollment aktif/terdaftar
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          spp_status,
          profiles!enrollments_student_id_fkey(full_name),
          classes(name, price)
        `)
        .eq("tenant_id", prof.tenant_id);

      if (!enrollments) {
        setPayments([]);
        return;
      }

      // 2. Ambil seluruh record SPP bulanan untuk targetYM dari tabel spp_payments
      const { data: sppPayments } = await supabase
        .from("spp_payments")
        .select("enrollment_id, status")
        .eq("month_year", targetYM);

      const sppMap: Record<string, "paid" | "unpaid"> = {};
      if (sppPayments) {
        sppPayments.forEach((p: any) => {
          sppMap[p.enrollment_id] = p.status as "paid" | "unpaid";
        });
      }

      const list: PaymentItem[] = enrollments.map((e: any) => {
        let status: "paid" | "unpaid" = "unpaid";

        if (sppMap[e.id] !== undefined) {
          // 1. Jika sudah ada catatan di tabel spp_payments untuk bulan ini, gunakan status tersebut
          status = sppMap[e.id];
        } else if (isCurrentMonth) {
          // 2. Khusus bulan berjalan (Agustus 2026), jika belum ada catatan di spp_payments, gunakan spp_status awal murid
          status = e.spp_status === "paid" ? "paid" : "unpaid";
        } else {
          // 3. Untuk bulan lainnya (Mei, Juni, Juli, September dst.), jika belum di-input di spp_payments -> default Belum Bayar
          status = "unpaid";
        }

        return {
          enrollmentId: e.id,
          studentName: e.profiles?.full_name ?? "Murid",
          className: e.classes?.name ?? "Kelas Umum",
          price: e.classes?.price ?? 0,
          status,
        };
      });

      setPayments(list);
    } catch (err) {
      console.error("Gagal memuat keuangan owner:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeuangan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleTogglePayment = async (enrollmentId: string, currentStatus: "paid" | "unpaid") => {
    setIsUpdating(enrollmentId);
    try {
      const newStatus: "paid" | "unpaid" = currentStatus === "paid" ? "unpaid" : "paid";

      // Upsert ke tabel spp_payments
      const { error } = await supabase
        .from("spp_payments")
        .upsert(
          {
            enrollment_id: enrollmentId,
            month_year: targetYM,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
          },
          { onConflict: "enrollment_id,month_year" }
        );

      if (error) {
        alert("Gagal memperbarui status SPP: " + error.message);
        return;
      }

      // Jika bulan yang diubah adalah bulan berjalan, update juga kolom spp_status pada enrollments
      if (isCurrentMonth) {
        await supabase
          .from("enrollments")
          .update({ spp_status: newStatus })
          .eq("id", enrollmentId);
      }

      await loadKeuangan();
    } catch (err: any) {
      alert("Error memperbarui status pembayaran: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

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
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* ── Header ── */}
      <header className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Laporan Keuangan <Wallet className="text-blue-600 h-6 w-6 shrink-0" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Kelola tagihan SPP bulanan murid per periode.
        </p>
      </header>

      {/* ── Control Bar Periode Bulan & Tahun (Mobile-First) ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Periode SPP</span>
              <span className="text-sm sm:text-base font-black text-slate-900">
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>
          </div>

          <div>
            {isCurrentMonth ? (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Bulan Ini
              </span>
            ) : selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth > now.getMonth()) ? (
              <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Bulan Mendatang
              </span>
            ) : (
              <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Bulan Lalu
              </span>
            )}
          </div>
        </div>

        {/* Controls Row (Fit All Screens) */}
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition active:scale-95 shrink-0"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="flex-1 min-w-0 px-2 sm:px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer truncate"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-20 sm:w-24 px-2 sm:px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shrink-0"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition active:scale-95 shrink-0"
            title="Bulan Selanjutnya"
          >
            <ChevronRight size={18} />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={() => {
                setSelectedMonth(now.getMonth());
                setSelectedYear(now.getFullYear());
              }}
              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition shrink-0 flex items-center gap-1 text-xs font-bold"
              title="Kembali ke Bulan Ini"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Bulan Ini</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-400 text-xs">Memuat laporan periode {MONTH_NAMES[selectedMonth]} {selectedYear}...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stats Cards (2 Columns on Mobile, 4 Columns on Desktop) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Card Total Omset */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block">Target Omset</span>
                <p className="text-base sm:text-2xl font-black text-slate-800 mt-0.5 sm:mt-1">{Format.rupiah(totalOmset)}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 mt-2 font-bold">
                <TrendingUp size={12} /> {MONTH_NAMES[selectedMonth].slice(0, 3)}
              </div>
            </div>

            {/* Card Diterima */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block">Lunas Diterima</span>
                <p className="text-base sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1">{Format.rupiah(totalDiterima)}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-bold">
                <CheckCircle size={12} /> Masuk
              </div>
            </div>

            {/* Card Tunggakan */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block">Belum Bayar</span>
                <p className="text-base sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">{Format.rupiah(totalTunggakan)}</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 mt-2 font-bold">
                <Percent size={12} /> Tunggakan
              </div>
            </div>

            {/* Card Persen Tertagih */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider block">Efisiensi</span>
                <p className="text-base sm:text-2xl font-black text-purple-600 mt-0.5 sm:mt-1">{persenTertagih}%</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-purple-600 mt-2 font-bold">
                <ArrowUpRight size={12} /> Tertagih
              </div>
            </div>
          </div>

          {/* ── Search & Filter Controls ── */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama murid atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              />
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto">
              {(["all", "paid", "unpaid"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-xl border transition text-center ${filterStatus === status
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {status === "all" ? "Semua" : status === "paid" ? "Lunas" : "Belum Bayar"}
                </button>
              ))}
            </div>
          </div>

          {/* ── MOBILE VIEW: Card List (No Horizontal Cut-off) ── */}
          <div className="md:hidden space-y-2.5">
            <div className="px-1 text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>Daftar Transaksi Murid</span>
              <span>Bulan {MONTH_NAMES[selectedMonth]} {selectedYear}</span>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
                Tidak ada data transaksi ditemukan.
              </div>
            ) : (
              filteredPayments.map((p) => (
                <div key={p.enrollmentId} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-sm truncate">{p.studentName}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{p.className}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">SPP</span>
                      <span className="font-black text-slate-900 text-sm">{Format.rupiah(p.price)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Status ({MONTH_NAMES[selectedMonth].slice(0, 3)}):</span>
                    <button
                      onClick={() => handleTogglePayment(p.enrollmentId, p.status)}
                      disabled={isUpdating === p.enrollmentId}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase border transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${p.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                    >
                      {isUpdating === p.enrollmentId ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : p.status === "paid" ? (
                        <>
                          <CheckCircle size={14} /> Lunas
                        </>
                      ) : (
                        <>Belum Bayar</>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── DESKTOP VIEW: Table List (md:block) ── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Daftar Transaksi SPP Periode <strong>{MONTH_NAMES[selectedMonth]} {selectedYear}</strong></span>
              <span>💡 Klik status siswa untuk mengubah status pembayaran bulan {MONTH_NAMES[selectedMonth]}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Nama Murid</th>
                    <th className="py-4 px-6">Kelas</th>
                    <th className="py-4 px-6 text-right">SPP Bulanan</th>
                    <th className="py-4 px-6 text-center">Status ({MONTH_NAMES[selectedMonth]} {selectedYear})</th>
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
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${p.status === "paid"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/70"
                                : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/70"
                              }`}
                            title={`Klik untuk mengubah status SPP ${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
                          >
                            {isUpdating === p.enrollmentId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : p.status === "paid" ? (
                              <>
                                <CheckCircle size={13} /> Lunas ({MONTH_NAMES[selectedMonth].slice(0, 3)})
                              </>
                            ) : (
                              <>Belum Bayar</>
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
        </>
      )}
    </div>
  );
}
