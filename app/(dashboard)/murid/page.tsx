"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Calendar, CheckCircle2, Clock, Loader2,
  TrendingUp, Star, ChevronRight, AlertCircle, BookMarked,
  Flame, Target
} from "lucide-react";
import Link from "next/link";
import { tampilEnrollmentMurid } from "@/services/studentService";
import { tampilHafalanTerkini, tampilRiwayatHafalan } from "@/services/hafalanService";
import { tampilAbsensiMurid, hitungStatistikAbsensi } from "@/services/attendanceService";
import { DAY_NAMES, Format, PROGRAM_TYPES, getProgressColor } from "@/lib/helpers";
import type { EnrollmentWithDetails, HafalanProgress, Schedule } from "@/types";

// ── Tipe hasil per-enrollment ──────────────────────────────
interface EnrollmentSummary {
  enrollment: EnrollmentWithDetails;
  hafalanTerkini: HafalanProgress | null;
  totalSesi: number;
  attendanceRate: number;
  jadwalHariIni: Schedule[];
}

export default function MuridDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [summaries, setSummaries] = useState<EnrollmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const today = new Date();
  const todayIdx = today.getDay();
  const todayStr = today.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ambil profil murid
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single();
      if (!prof) { setIsLoading(false); return; }
      setProfile(prof);

      // Ambil seluruh enrollment murid yang sedang login
      const enrollments = await tampilEnrollmentMurid(prof.id);

      // Untuk tiap enrollment, ambil data hafalan + absensi
      const results = await Promise.all(
        enrollments.map(async (enr) => {
          const [hafalanTerkini, riwayatAbsensi, semuaHafalan] = await Promise.all([
            tampilHafalanTerkini(enr.id).catch(() => null),
            tampilAbsensiMurid(enr.id).catch(() => []),
            tampilRiwayatHafalan(enr.id).catch(() => []),
          ]);

          const stats = hitungStatistikAbsensi(riwayatAbsensi);
          const jadwalHariIni = (enr.schedules ?? []).filter(
            (s) => s.day_of_week === todayIdx
          );

          return {
            enrollment: enr,
            hafalanTerkini,
            totalSesi: semuaHafalan.length,
            attendanceRate: stats.persentase,
            jadwalHariIni,
          } as EnrollmentSummary;
        })
      );

      setSummaries(results);
      setIsLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat data belajarmu...</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Murid";
  const totalAktif = summaries.filter((s) => s.enrollment.status === "active").length;
  const rataAbsensi = summaries.length > 0
    ? Math.round(summaries.reduce((acc, s) => acc + s.attendanceRate, 0) / summaries.length)
    : 0;
  const totalSesiHafalan = summaries.reduce((acc, s) => acc + s.totalSesi, 0);
  const jadwalHariIniAll = summaries.flatMap((s) =>
    s.jadwalHariIni.map((j) => ({ ...j, kelasName: s.enrollment.classes?.name ?? "-" }))
  );

  return (
    <div className="space-y-6">
      {/* ── Header Greeting ── */}
      <header className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium mb-1">{todayStr}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Assalamu&apos;alaikum, {firstName}! 👋
        </h1>
        <p className="text-blue-200 text-sm mt-1">
          Semangat belajar hari ini. Ilmu adalah cahaya! ✨
        </p>
      </header>

      {/* ── Stats Overview ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <BookOpen size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600">{totalAktif}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kelas Aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Flame size={18} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalSesiHafalan}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sesi Hafalan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Target size={18} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600">{rataAbsensi}%</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kehadiran</p>
        </div>
      </div>

      {/* ── Jadwal Hari Ini ── */}
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          Jadwal Hari Ini
        </h2>
        {jadwalHariIniAll.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4 text-slate-400">
            <div className="p-3 bg-slate-50 rounded-xl">
              <Calendar size={22} className="text-slate-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-500">Tidak ada jadwal hari ini</p>
              <p className="text-xs mt-0.5">Gunakan waktu luang untuk murajaah 📖</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {jadwalHariIniAll.map((j, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <CheckCircle2 size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{j.activity}</p>
                    <p className="text-xs text-slate-500">{j.kelasName}</p>
                  </div>
                </div>
                {j.time_start && (
                  <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl">
                    <Clock size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-600">
                      {j.time_start.slice(0, 5)}
                      {j.time_end ? ` – ${j.time_end.slice(0, 5)}` : ""}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Per-Kelas Summary ── */}
      {summaries.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={22} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Belum terdaftar di kelas manapun</p>
            <p className="text-sm text-amber-700 mt-1">
              Hubungi ustadz/ustadzah untuk mendaftarkan kamu ke kelas yang sesuai.
            </p>
          </div>
        </div>
      ) : (
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookMarked size={18} className="text-blue-600" />
            Kelas Saya
          </h2>
          <div className="space-y-4">
            {summaries.map((s) => {
              const kelas = s.enrollment.classes;
              const programInfo = kelas?.type ? PROGRAM_TYPES[kelas.type] : null;
              const hafalan = s.hafalanTerkini;

              return (
                <div key={s.enrollment.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Header Kelas */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{programInfo?.icon ?? "📚"}</span>
                      <div>
                        <p className="font-bold text-white text-sm">{kelas?.name ?? "-"}</p>
                        <p className="text-slate-400 text-xs">{programInfo?.label ?? kelas?.type}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      s.enrollment.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-500/20 text-slate-400"
                    }`}>
                      {s.enrollment.status === "active" ? "Aktif" : s.enrollment.status}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Hafalan Terkini */}
                    {kelas?.type === "tahfidz" && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Hafalan Terkini
                        </p>
                        {hafalan ? (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-blue-900">{hafalan.surah_name}</p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                  Ayat {hafalan.ayat_reached} / {hafalan.total_ayat}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-blue-600 text-lg">
                                  {Math.round((hafalan.ayat_reached / hafalan.total_ayat) * 100)}%
                                </p>
                                <p className="text-[10px] text-blue-400">
                                  {Format.tanggalPendek(hafalan.session_date)}
                                </p>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getProgressColor(Math.round((hafalan.ayat_reached / hafalan.total_ayat) * 100))}`}
                                style={{ width: `${Math.min((hafalan.ayat_reached / hafalan.total_ayat) * 100, 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-blue-500 mt-1.5">
                              Total {s.totalSesi} sesi hafalan tercatat
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-slate-400">Belum ada data hafalan</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Kehadiran */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Tingkat Kehadiran
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(s.attendanceRate)}`}
                            style={{ width: `${s.attendanceRate}%` }}
                          />
                        </div>
                        <span className={`text-sm font-black ${
                          s.attendanceRate >= 80 ? "text-green-600"
                          : s.attendanceRate >= 50 ? "text-yellow-600"
                          : "text-red-500"
                        }`}>
                          {s.attendanceRate}%
                        </span>
                      </div>
                    </div>

                    {/* Jadwal Minggu Ini */}
                    {(s.enrollment.schedules ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Jadwal Belajar
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(s.enrollment.schedules ?? []).map((sch, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                                sch.day_of_week === todayIdx
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              {DAY_NAMES[sch.day_of_week]}
                              {sch.time_start ? ` ${sch.time_start.slice(0, 5)}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Motivasi ── */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 bg-emerald-600 rounded-xl shrink-0">
          <Star size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-emerald-800 text-sm">Kata Mutiara Hari Ini</p>
          <p className="text-emerald-700 text-sm mt-1 italic">
            &ldquo;Barang siapa yang menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan ke surga.&rdquo;
          </p>
          <p className="text-emerald-500 text-xs mt-1">— HR. Muslim</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          Menu Cepat
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/murid/kelas"
            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-all">
                <BookOpen size={18} className="text-blue-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">Kelas Saya</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
          <Link href="/murid/raport"
            className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-200 hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl group-hover:bg-purple-600 transition-all">
                <Star size={18} className="text-purple-600 group-hover:text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800">Raport Saya</span>
            </div>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
        </div>
      </section>
    </div>
  );
}
