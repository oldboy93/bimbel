"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, GraduationCap, BookOpen, Loader2, TrendingUp, Calendar, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function OwnerDashboard() {
  const [stats, setStats] = useState({ murid: 0, guru: 0, kelas: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: countMurid },
          { count: countGuru },
          { count: countKelas }
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "murid"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guru"),
          supabase.from("classes").select("*", { count: "exact", head: true })
        ]);

        setStats({
          murid: countMurid || 0,
          guru: countGuru || 0,
          kelas: countKelas || 0
        });
      } catch (err) {
        console.error("Gagal memuat statistik dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Dashboard Owner <TrendingUp className="text-blue-600" />
        </h1>
        <p className="text-slate-500 mt-2">Pantau metrik dan perkembangan operasional seluruh cabang bimbingan belajar.</p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/owner/murid" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">Total Murid</h3>
            <p className="text-4xl font-black text-blue-600">{stats.murid}</p>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
            <GraduationCap size={28} />
          </div>
        </Link>

        <Link href="/owner/guru" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">Total Guru</h3>
            <p className="text-4xl font-black text-slate-900">{stats.guru}</p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">
            <Users size={28} />
          </div>
        </Link>

        <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-500 text-sm uppercase tracking-wider">Kelas Aktif</h3>
            <p className="text-4xl font-black text-slate-900">{stats.kelas}</p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl">
            <BookOpen size={28} />
          </div>
        </div>
      </div>

      {/* RLS Warning / Security Advisor */}
      <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
        <div className="flex gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-base">Aturan RLS Supabase Aktif</h4>
            <p className="text-blue-700 text-sm mt-1">Keamanan data terisolasi dengan ketat sehingga murid/guru hanya bisa melihat data milik mereka sendiri sesuai prinsip SaaS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
