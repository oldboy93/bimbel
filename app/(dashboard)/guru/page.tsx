"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Calendar, BookOpen, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { tampilSemuaEnrollment } from "@/services/studentService";
import { getTodaySchedule, DAY_NAMES } from "@/lib/helpers";
import type { EnrollmentWithDetails } from "@/types";

export default function GuruDashboard() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      const enrData = await tampilSemuaEnrollment();
      setEnrollments(enrData);
      setIsLoading(false);
    };
    load();
  }, []);

  const today = new Date();
  const todayName = DAY_NAMES[today.getDay()];
  const todayStr = today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const activeStudents = enrollments.filter(e => e.status === "active");
  // Group by class
  const classCounts: Record<string, { name: string; count: number }> = {};
  activeStudents.forEach(e => {
    const cid = e.class_id;
    if (!classCounts[cid]) classCounts[cid] = { name: e.classes?.name ?? "-", count: 0 };
    classCounts[cid].count++;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-sm font-medium text-blue-600 mb-1">{todayStr}</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Assalamu'alaikum, {profile?.full_name?.split(" ")[0] ?? "Ustadz"} 👋
        </h1>
        <p className="text-slate-500 mt-1">Berikut ringkasan aktivitas mengajar Anda.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Murid Aktif</span>
          </div>
          <p className="text-4xl font-black text-blue-600">{activeStudents.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><BookOpen size={20} /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{Object.keys(classCounts).length}</p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Hari Ini</span>
          </div>
          <p className="text-2xl font-black">{todayName}</p>
          <p className="text-blue-200 text-sm mt-0.5">{today.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* Kelas per Enrollment */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">Daftar Kelas</h2>
          <Link href="/guru/murid" className="text-sm font-semibold text-blue-600 hover:underline">
            Lihat Semua Murid →
          </Link>
        </div>

        {Object.keys(classCounts).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <p className="text-slate-400">Belum ada murid yang terdaftar di kelas manapun.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(classCounts).map(([cid, cls]) => (
              <div key={cid} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{cls.name}</h3>
                    <p className="text-sm text-slate-500">{cls.count} murid aktif</p>
                  </div>
                </div>
                <Link href="/guru/murid"
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-xl transition">
                  Kelola
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/guru/absen"
            className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition flex flex-col gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Input Absensi</p>
              <p className="text-xs text-slate-500 mt-0.5">Tandai kehadiran murid hari ini</p>
            </div>
          </Link>

          <Link href="/guru/murid"
            className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition flex flex-col gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-all">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Update Hafalan</p>
              <p className="text-xs text-slate-500 mt-0.5">Input progress hafalan murid</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
