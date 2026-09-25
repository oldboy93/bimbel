"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Calendar, CheckCircle2, Clock, Loader2,
  TrendingUp, Star, ChevronRight, AlertCircle, BookMarked,
  Flame, Target, Trophy, RefreshCw, MessageSquare, FileText,
  UserCheck, ChevronLeft, Award, Sparkles, BookCheck, ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { tampilEnrollmentMurid } from "@/services/studentService";
import { tampilHafalanTerkini, tampilRiwayatHafalan } from "@/services/hafalanService";
import { tampilRiwayatMurajaah } from "@/services/murajaahService";
import { tampilRiwayatIqro } from "@/services/iqroService";
import { tampilAbsensiMurid, hitungStatistikAbsensi } from "@/services/attendanceService";
import { tampilCatatanUntukWali } from "@/services/notesService";
import { getClassLeaderboard, type LeaderboardEntry } from "@/services/leaderboardService";
import { DAY_NAMES, Format, PROGRAM_TYPES, getProgressColor, ATTENDANCE_STATUS } from "@/lib/helpers";
import type {
  EnrollmentWithDetails,
  HafalanProgress,
  IqroProgress,
  MurajaahSession,
  TeacherNote,
  Attendance,
  Schedule
} from "@/types";

const HADITHS = [
  { text: "Barang siapa yang menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan ke surga.", narrator: "HR. Muslim" },
  { text: "Sebaik-baik kalian adalah orang yang mempelajari Al-Qur'an dan mengajarkannya.", narrator: "HR. Bukhari" },
  { text: "Sesungguhnya Allah tidak melihat kepada rupa dan harta kalian, tetapi Dia melihat kepada hati dan amal kalian.", narrator: "HR. Muslim" },
  { text: "Senyummu di hadapan saudaramu adalah sedekah.", narrator: "HR. Tirmidzi" },
  { text: "Barang siapa yang beriman kepada Allah dan hari akhir, maka hendaklah ia berkata baik atau diam.", narrator: "HR. Bukhari & Muslim" },
  { text: "Sesungguhnya kejujuran itu membawa kepada kebaikan, dan kebaikan itu membawa ke surga.", narrator: "HR. Bukhari & Muslim" },
  { text: "Keridaan Allah tergantung pada keridaan kedua orang tua, dan kemurkaan Allah tergantung pada kemurkaan kedua orang tua.", narrator: "HR. Tirmidzi" },
  { text: "Mukmin yang paling sempurna imannya adalah yang paling baik akhlaknya.", narrator: "HR. Tirmidzi" },
  { text: "Menuntut ilmu itu wajib atas setiap Muslim.", narrator: "HR. Ibnu Majah" },
  { text: "Orang yang menunjukkan kepada kebaikan, maka ia memperoleh pahala seperti orang yang melakukannya.", narrator: "HR. Muslim" }
];

const ITEMS_PER_PAGE = 5;

function paginate<T>(items: T[], page: number, perPage = ITEMS_PER_PAGE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  return { items: pageItems, totalPages, currentPage, total };
}

function PaginationControl({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
      <span className="text-slate-400 font-medium text-[11px]">
        Hal <strong className="text-slate-700">{currentPage}</strong> / {totalPages} ({total} data)
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 font-bold transition flex items-center gap-1 text-[11px]"
        >
          <ChevronLeft size={13} />
          <span>Sebelumnya</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 font-bold transition flex items-center gap-1 text-[11px]"
        >
          <span>Berikutnya</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default function MuridDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [selectedEnrId, setSelectedEnrId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Active Tab: "beranda" | "hafalan" | "iqro" | "kehadiran" | "catatan"
  const [activeTab, setActiveTab] = useState<string>("beranda");
  const [hafalanSubTab, setHafalanSubTab] = useState<"hafalan" | "murajaah">("hafalan");

  // Pagination states
  const [pageHafalan, setPageHafalan] = useState(1);
  const [pageMurajaah, setPageMurajaah] = useState(1);
  const [pageIqro, setPageIqro] = useState(1);
  const [pageAbsensi, setPageAbsensi] = useState(1);
  const [pageCatatan, setPageCatatan] = useState(1);

  // Detailed records for the active enrollment
  const [hafalanTerkini, setHafalanTerkini] = useState<HafalanProgress | null>(null);
  const [riwayatHafalan, setRiwayatHafalan] = useState<HafalanProgress[]>([]);
  const [riwayatMurajaah, setRiwayatMurajaah] = useState<MurajaahSession[]>([]);
  const [iqroTerkini, setIqroTerkini] = useState<IqroProgress | null>(null);
  const [riwayatIqro, setRiwayatIqro] = useState<IqroProgress[]>([]);
  const [riwayatAbsensi, setRiwayatAbsensi] = useState<Attendance[]>([]);
  const [catatanGuru, setCatatanGuru] = useState<TeacherNote[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const today = new Date();
  const todayIdx = today.getDay();
  const todayStr = today.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Daily Hadith
  const dailyHadith = useMemo(() => {
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return HADITHS[dayOfYear % HADITHS.length];
  }, [today]);

  // Initial load: Profile & Enrollments
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const activeStudentId = localStorage.getItem("active_student_id") || user.id;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", activeStudentId)
        .single();

      if (!prof) {
        setIsLoading(false);
        return;
      }
      setProfile(prof);

      const enrList = await tampilEnrollmentMurid(prof.id);
      setEnrollments(enrList);

      if (enrList.length > 0) {
        setSelectedEnrId(enrList[0].id);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  // Selected Enrollment object
  const currentEnrollment = useMemo(() => {
    return enrollments.find((e) => e.id === selectedEnrId) || enrollments[0] || null;
  }, [enrollments, selectedEnrId]);

  // Load detailed records whenever selectedEnrId changes
  useEffect(() => {
    if (!currentEnrollment) return;

    const loadEnrollmentDetails = async () => {
      setIsDataLoading(true);
      const enrId = currentEnrollment.id;

      try {
        const [
          hTerkini,
          rhafalan,
          rmurajaah,
          riqro,
          rabsensi,
          rcatatan,
          rleaderboard,
        ] = await Promise.all([
          tampilHafalanTerkini(enrId).catch(() => null),
          tampilRiwayatHafalan(enrId).catch(() => []),
          tampilRiwayatMurajaah(enrId).catch(() => []),
          tampilRiwayatIqro(enrId).catch(() => []),
          tampilAbsensiMurid(enrId).catch(() => []),
          tampilCatatanUntukWali(enrId).catch(() => []),
          profile ? getClassLeaderboard(profile.id, 5).catch(() => []) : Promise.resolve([]),
        ]);

        setHafalanTerkini(hTerkini);
        setRiwayatHafalan(rhafalan);
        setRiwayatMurajaah(rmurajaah);
        setIqroTerkini(riqro[0] ?? null);
        setRiwayatIqro(riqro);
        setRiwayatAbsensi(rabsensi);
        setCatatanGuru(rcatatan);
        setLeaderboard(rleaderboard);

        // Reset pages to 1 on class switch
        setPageHafalan(1);
        setPageMurajaah(1);
        setPageIqro(1);
        setPageAbsensi(1);
        setPageCatatan(1);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadEnrollmentDetails();
  }, [currentEnrollment?.id, profile?.id]);

  // Auto-scroll active tab button into center on mobile
  useEffect(() => {
    if (activeTab && mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm font-medium">Memuat data belajarmu...</p>
        </div>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Murid";
  const isCalistung = currentEnrollment?.classes?.type === "calistung";
  const statsAbsensi = hitungStatistikAbsensi(riwayatAbsensi);

  // Jadwal Hari Ini
  const parseSession = (s: Schedule) => {
    const rawNotes = s.material_notes || "";
    if (rawNotes.startsWith("DATE:")) {
      const parts = rawNotes.split("|NOTES:");
      const dateStr = parts[0].replace("DATE:", "");
      const notesStr = parts[1] || "";
      return { isCustom: true, date: dateStr, notes: notesStr };
    }
    return { isCustom: false, date: null, notes: rawNotes };
  };

  const jadwalHariIni = (currentEnrollment?.schedules ?? []).filter((s) => {
    const parsed = parseSession(s);
    if (parsed.isCustom) {
      const todayStrLocal = new Date().toLocaleDateString("en-CA");
      return parsed.date === todayStrLocal;
    }
    return s.day_of_week === todayIdx;
  });

  // Tab definitions
  const tabsList = [
    { key: "beranda", label: "Beranda", icon: Sparkles },
    ...(!isCalistung ? [{ key: "hafalan", label: "Hafalan", icon: BookOpen }] : []),
    { key: "iqro", label: isCalistung ? "Calistung" : "Iqro & Aisar", icon: BookMarked },
    { key: "kehadiran", label: "Kehadiran", icon: UserCheck },
    { key: "catatan", label: "Catatan & Raport", icon: MessageSquare },
  ];

  // Paginated Slices
  const paginatedHafalan = paginate(riwayatHafalan, pageHafalan);
  const paginatedMurajaah = paginate(riwayatMurajaah, pageMurajaah);
  const paginatedIqro = paginate(riwayatIqro, pageIqro);
  const paginatedAbsensi = paginate(riwayatAbsensi, pageAbsensi);
  const paginatedCatatan = paginate(catatanGuru, pageCatatan);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-20">
      {/* ── 1. HEADER RINGKAS & MOBILE FRIENDLY ── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-5 text-white shadow-md shadow-blue-500/20 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-lg pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              {profile?.full_name?.charAt(0).toUpperCase() ?? "M"}
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-blue-200 tracking-wide uppercase">
                Portal Belajar Murid
              </span>
              <h1 className="text-lg font-black tracking-tight truncate leading-tight">
                {profile?.full_name}
              </h1>
              <p className="text-[11px] text-blue-100/90 truncate mt-0.5">
                {currentEnrollment?.classes?.name ?? "Belum terdaftar kelas"}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/25 shrink-0 whitespace-nowrap">
            {todayStr}
          </span>
        </div>

        {/* ── CLASS SWITCHER CHIP (jika murid punya lebih dari 1 kelas) ── */}
        {enrollments.length > 1 && (
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider shrink-0">
              Pilih Kelas:
            </span>
            <div className="flex gap-1.5">
              {enrollments.map((enr) => {
                const isSelected = enr.id === currentEnrollment?.id;
                return (
                  <button
                    key={enr.id}
                    onClick={() => setSelectedEnrId(enr.id)}
                    className={`text-xs px-3 py-1 rounded-xl font-bold transition shrink-0 ${
                      isSelected
                        ? "bg-white text-blue-700 shadow-sm"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {enr.classes?.name ?? "Kelas"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. QUICK STATS STRIP (COMPACT CARDS) ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Stat 1: Hafalan / Materi */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-1.5">
            <BookOpen size={16} />
          </div>
          <p className="text-lg font-black text-slate-800 leading-tight">
            {riwayatHafalan.length}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Setoran Hafalan
          </p>
        </div>

        {/* Stat 2: Iqro / Aisar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-1.5">
            <BookMarked size={16} />
          </div>
          <p className="text-lg font-black text-slate-800 leading-tight">
            {iqroTerkini ? (iqroTerkini.type === "iqro" ? `Jilid ${iqroTerkini.jilid}` : `Modul ${iqroTerkini.jilid}`) : "-"}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Level Iqro
          </p>
        </div>

        {/* Stat 3: Kehadiran */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl mb-1.5">
            <Target size={16} />
          </div>
          <p className="text-lg font-black text-slate-800 leading-tight">
            {statsAbsensi.persentase}%
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Kehadiran
          </p>
        </div>
      </div>

      {/* ── 3. STICKY MOBILE SEGMENTED TAB BAR ── */}
      <div
        ref={mobileNavRef}
        className="sticky top-2 z-30 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/40 flex gap-1 overflow-x-auto scrollbar-hide"
      >
        {tabsList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 flex-1 min-w-fit px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 4. TAB CONTENTS (NO UNLIMITED SCROLL, COMPACT & PAGINATED) ── */}
      {isDataLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
        </div>
      ) : !currentEnrollment ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={22} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Belum terdaftar di kelas manapun</p>
            <p className="text-sm text-amber-700 mt-1">
              Hubungi admin atau ustadz untuk didaftarkan ke kelas aktif.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* ═════════════════════════════════════════════════════════════
              TAB 1: BERANDA & MADING
             ═════════════════════════════════════════════════════════════ */}
          {activeTab === "beranda" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Jadwal Hari Ini */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Calendar size={16} />
                    </div>
                    <h2 className="font-extrabold text-slate-800 text-sm">Jadwal Hari Ini</h2>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                    {DAY_NAMES[todayIdx]}
                  </span>
                </div>

                {jadwalHariIni.length === 0 ? (
                  <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400">
                    <p className="text-xs font-semibold text-slate-600">Tidak ada jadwal les hari ini 🎉</p>
                    <p className="text-[11px] mt-0.5">Waktunya murajaah hafalan santai di rumah 📖</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jadwalHariIni.map((sch, i) => (
                      <div
                        key={i}
                        className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{sch.activity}</p>
                            <p className="text-[10px] text-slate-500">{currentEnrollment.classes?.name}</p>
                          </div>
                        </div>
                        {sch.time_start && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                            <Clock size={12} />
                            <span>{sch.time_start.slice(0, 5)} {sch.time_end ? `– ${sch.time_end.slice(0, 5)}` : ""}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mading Mini: Leaderboard Kelas Murid Terajin */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-slate-800 text-sm">Mading Murid Terajin</h2>
                      <p className="text-[10px] text-slate-400 font-medium">Bulan ini di {currentEnrollment.classes?.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    🏆 Top 5
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                    Belum ada rekapan poin di kelas ini.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {leaderboard.map((entry, idx) => {
                      const isMe = entry.student_id === profile?.id;
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div
                          key={entry.student_id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                            isMe
                              ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-300"
                              : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-black w-6 text-center">
                              {medals[idx] ?? `#${idx + 1}`}
                            </span>
                            <div>
                              <p className={`text-xs font-bold leading-tight ${isMe ? "text-amber-900" : "text-slate-800"}`}>
                                {entry.student_name} {isMe && <span className="text-[10px] text-amber-700 bg-amber-200/80 px-1.5 py-0.2 rounded font-black ml-1">(Kamu)</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {entry.total_setoran} setoran • {entry.attendance_rate}% hadir
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            {entry.score} Poin
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hadits Motivasi Hari Ini */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
                  <Star size={16} />
                </div>
                <div>
                  <p className="font-extrabold text-emerald-900 text-xs uppercase tracking-wider">
                    Hadits Hari Ini
                  </p>
                  <p className="text-xs text-emerald-800 italic mt-1 leading-relaxed font-medium">
                    &ldquo;{dailyHadith.text}&rdquo;
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-1">— {dailyHadith.narrator}</p>
                </div>
              </div>

              {/* Menu Navigasi Cepat */}
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/murid/kelas"
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-200 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Materi LMS</p>
                      <p className="text-[10px] text-slate-400">Modul & video</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </Link>

                <Link
                  href="/murid/raport"
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs hover:border-purple-200 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Raport Belajar</p>
                      <p className="text-[10px] text-slate-400">Cetak & unduh</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </Link>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 2: HAFALAN & MURAJAAH
             ═════════════════════════════════════════════════════════════ */}
          {activeTab === "hafalan" && !isCalistung && (
            <div className="space-y-4 animate-fadeIn">
              {/* Card Target Hafalan Terkini */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Target Hafalan Terkini
                  </span>
                  {hafalanTerkini && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {Format.tanggalPendek(hafalanTerkini.session_date)}
                    </span>
                  )}
                </div>

                {hafalanTerkini ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{hafalanTerkini.surah_name}</h3>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                          Ayat {hafalanTerkini.ayat_reached} <span className="font-normal text-slate-400">/ {hafalanTerkini.total_ayat} Ayat</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-blue-600">
                          {Math.round((hafalanTerkini.ayat_reached / hafalanTerkini.total_ayat) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(Math.round((hafalanTerkini.ayat_reached / hafalanTerkini.total_ayat) * 100))}`}
                        style={{ width: `${Math.min((hafalanTerkini.ayat_reached / hafalanTerkini.total_ayat) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">Belum ada target hafalan yang tercatat.</p>
                )}
              </div>

              {/* Sub-tab selector: Setoran Baru vs Murajaah */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setHafalanSubTab("hafalan")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    hafalanSubTab === "hafalan"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Riwayat Setoran ({riwayatHafalan.length})</span>
                </button>
                <button
                  onClick={() => setHafalanSubTab("murajaah")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    hafalanSubTab === "murajaah"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <RefreshCw size={14} />
                  <span>Murajaah ({riwayatMurajaah.length})</span>
                </button>
              </div>

              {/* Sub-tab 1: Riwayat Setoran Hafalan */}
              {hafalanSubTab === "hafalan" && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  {paginatedHafalan.items.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat setoran hafalan.</p>
                  ) : (
                    <div className="space-y-2">
                      {paginatedHafalan.items.map((h) => (
                        <div key={h.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{h.surah_name}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              h.status === "lulus"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {h.status === "lulus" ? "Lulus" : "Mengulang"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Ayat {h.ayat_reached} dari {h.total_ayat}</span>
                            <span>{Format.tanggalIndo(h.session_date)}</span>
                          </div>
                          {h.notes && (
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic mt-1">
                              "{h.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <PaginationControl
                    currentPage={paginatedHafalan.currentPage}
                    totalPages={paginatedHafalan.totalPages}
                    total={paginatedHafalan.total}
                    onPageChange={setPageHafalan}
                  />
                </div>
              )}

              {/* Sub-tab 2: Riwayat Murajaah */}
              {hafalanSubTab === "murajaah" && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                  {paginatedMurajaah.items.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat murajaah.</p>
                  ) : (
                    <div className="space-y-2">
                      {paginatedMurajaah.items.map((m) => (
                        <div key={m.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{m.surah_name}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              m.quality === "lancar"
                                ? "bg-emerald-100 text-emerald-700"
                                : m.quality === "perlu_perbaikan"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}>
                              {m.quality === "lancar" ? "✨ Lancar" : m.quality === "perlu_perbaikan" ? "👍 Perlu Perbaikan" : "Mengulang"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{m.ayat_or_page_range ? `Rentang: ${m.ayat_or_page_range}` : "Penuh"}</span>
                            <span>{Format.tanggalIndo(m.session_date)}</span>
                          </div>
                          {m.notes && (
                            <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic mt-1">
                              "{m.notes}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <PaginationControl
                    currentPage={paginatedMurajaah.currentPage}
                    totalPages={paginatedMurajaah.totalPages}
                    total={paginatedMurajaah.total}
                    onPageChange={setPageMurajaah}
                  />
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 3: IQRO & AISAR
             ═════════════════════════════════════════════════════════════ */}
          {activeTab === "iqro" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Card Jilid Terkini & Step Bar */}
              {iqroTerkini ? (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {iqroTerkini.type === "iqro" ? "Buku Iqro" : "Modul Aisar"} Terkini
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {iqroTerkini.type === "iqro" ? `Iqro Jilid ${iqroTerkini.jilid}` : `Aisar Modul ${iqroTerkini.jilid}`}
                      </h3>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        Halaman {iqroTerkini.halaman} <span className="font-normal text-slate-400">/ {iqroTerkini.total_halaman} Hlm</span>
                      </p>
                    </div>

                    <div>
                      {(() => {
                        const lvl = iqroTerkini.level;
                        const badge = lvl === "mahir" ? { label: "🌟 Mahir", bg: "bg-indigo-600 text-white" }
                          : lvl === "lancar" ? { label: "✨ Lancar", bg: "bg-emerald-600 text-white" }
                          : lvl === "cukup" ? { label: "👍 Cukup", bg: "bg-amber-500 text-white" }
                          : { label: "💪 Latihan", bg: "bg-rose-500 text-white" };
                        return (
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow-xs ${badge.bg}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Step Tracker Visual */}
                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Tahapan {iqroTerkini.type === "iqro" ? "Jilid" : "Modul"}</span>
                      <span>{Math.round((iqroTerkini.halaman / iqroTerkini.total_halaman) * 100)}% Tuntas</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {Array.from({ length: iqroTerkini.type === "iqro" ? 6 : 3 }).map((_, idx) => {
                        const step = idx + 1;
                        const isCurrent = step === iqroTerkini.jilid;
                        const isPassed = step < iqroTerkini.jilid;
                        return (
                          <div
                            key={step}
                            className={`py-1.5 text-center rounded-lg font-black text-xs border transition ${
                              isCurrent
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : isPassed
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-white text-slate-400 border-slate-200"
                            }`}
                          >
                            {iqroTerkini.type === "iqro" ? `J${step}` : `M${step}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                  Belum ada data modul Iqro/Aisar yang tercatat.
                </div>
              )}

              {/* Riwayat Setoran Iqro (Paginated) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Setoran Iqro & Aisar</h3>
                  <span className="text-[10px] font-bold text-slate-400">{riwayatIqro.length} Total Sesi</span>
                </div>

                {paginatedIqro.items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat setoran.</p>
                ) : (
                  <div className="space-y-2">
                    {paginatedIqro.items.map((iq) => (
                      <div key={iq.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            {iq.type === "iqro" ? `Iqro Jilid ${iq.jilid}` : `Aisar Modul ${iq.jilid}`} • Halaman {iq.halaman}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                            {iq.level}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{Format.tanggalIndo(iq.session_date)}</p>
                        {iq.notes && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic mt-1">
                            "{iq.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <PaginationControl
                  currentPage={paginatedIqro.currentPage}
                  totalPages={paginatedIqro.totalPages}
                  total={paginatedIqro.total}
                  onPageChange={setPageIqro}
                />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 4: KEHADIRAN
             ═════════════════════════════════════════════════════════════ */}
          {activeTab === "kehadiran" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Ringkasan Kehadiran */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm">Rekap Kehadiran</h3>
                  <span className="text-base font-black text-purple-600">{statsAbsensi.persentase}% Hadir</span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(statsAbsensi.persentase)}`}
                    style={{ width: `${statsAbsensi.persentase}%` }}
                  />
                </div>

                {/* Stats Counter */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                    <p className="text-base font-black text-emerald-700">{statsAbsensi.hadir}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Hadir</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl">
                    <p className="text-base font-black text-amber-700">{statsAbsensi.ijin}</p>
                    <p className="text-[10px] font-bold text-amber-600 uppercase">Izin</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl">
                    <p className="text-base font-black text-rose-700">{statsAbsensi.alpha}</p>
                    <p className="text-[10px] font-bold text-rose-600 uppercase">Alpa</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <p className="text-base font-black text-slate-700">{statsAbsensi.total}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Sesi</p>
                  </div>
                </div>
              </div>

              {/* Riwayat Absensi (Paginated) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Pertemuan</h3>
                  <span className="text-[10px] font-bold text-slate-400">{riwayatAbsensi.length} Data Pertemuan</span>
                </div>

                {paginatedAbsensi.items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada catatan absensi.</p>
                ) : (
                  <div className="space-y-1.5">
                    {paginatedAbsensi.items.map((att) => {
                      const st = ATTENDANCE_STATUS[att.status as keyof typeof ATTENDANCE_STATUS] ?? {
                        label: att.status,
                        color: "bg-slate-500",
                        textColor: "text-slate-700"
                      };
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${st.color} shrink-0`} />
                            <div>
                              <p className="text-xs font-bold text-slate-800">{Format.tanggalIndo(att.date)}</p>
                              {att.notes && <p className="text-[10px] text-slate-400 mt-0.5">{att.notes}</p>}
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 ${st.textColor}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <PaginationControl
                  currentPage={paginatedAbsensi.currentPage}
                  totalPages={paginatedAbsensi.totalPages}
                  total={paginatedAbsensi.total}
                  onPageChange={setPageAbsensi}
                />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════
              TAB 5: CATATAN GURU & RAPORT
             ═════════════════════════════════════════════════════════════ */}
          {activeTab === "catatan" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Banner Raport Belajar */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 shrink-0">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm leading-tight">Raport Hasil Belajar</h3>
                    <p className="text-[11px] text-purple-100 mt-0.5">Tinjau evaluasi capaian & nilai semester</p>
                  </div>
                </div>
                <Link
                  href="/murid/raport"
                  className="px-3 py-1.5 bg-white text-purple-700 font-bold text-xs rounded-xl shadow-xs hover:bg-purple-50 transition shrink-0 whitespace-nowrap"
                >
                  Buka Raport
                </Link>
              </div>

              {/* Catatan dari Ustadz / Guru (Paginated) */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                      <MessageSquare size={16} />
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Catatan Perkembangan dari Guru</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{catatanGuru.length} Catatan</span>
                </div>

                {paginatedCatatan.items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada catatan dari guru untuk wali murid.</p>
                ) : (
                  <div className="space-y-2.5">
                    {paginatedCatatan.items.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-xl border border-cyan-100 bg-cyan-50/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider bg-cyan-100/70 px-2 py-0.5 rounded-md">
                            Catatan Ustadz / Guru
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {Format.tanggalIndo(note.note_date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <PaginationControl
                  currentPage={paginatedCatatan.currentPage}
                  totalPages={paginatedCatatan.totalPages}
                  total={paginatedCatatan.total}
                  onPageChange={setPageCatatan}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
