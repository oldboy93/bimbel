"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tampilEnrollmentMurid, tampilMurid } from "@/services/studentService";
import { Loader2, ArrowLeft, Calendar, BookOpen, RefreshCw, BookMarked, Award, MessageSquare, FileText } from "lucide-react";
import Link from "next/link";
import type { Profile, EnrollmentWithDetails } from "@/types";

// Tab Components
import TabJadwal from "./TabJadwal";
import TabHafalan from "./TabHafalan";
import TabMurajaah from "./TabMurajaah";
import TabIqro from "./TabIqro";
import TabTajwid from "./TabTajwid";
import TabCalistung from "./TabCalistung";
import TabCatatan from "./TabCatatan";
import TabRaport from "./TabRaport";

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [activeTab, setActiveTab] = useState("jadwal");
  const [student, setStudent] = useState<Profile | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [guruId, setGuruId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const isClickingTab = useRef(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setGuruId(user.id);

      const [prof, enrList] = await Promise.all([
        tampilMurid(studentId),
        tampilEnrollmentMurid(studentId),
      ]);
      setStudent(prof);
      if (enrList[0]) {
        setEnrollment(enrList[0]);
        setTenantId(enrList[0].tenant_id);
      }
      setIsLoading(false);
    };
    load();
  }, [studentId]);

  // Auto-scroll mobile navigation bar when activeTab changes
  useEffect(() => {
    if (activeTab && mobileNavRef.current) {
      const activeBtn = mobileNavRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  // IntersectionObserver for Mobile Scrollspy
  useEffect(() => {
    if (isLoading || !enrollment) return;

    const mainEl = document.querySelector("main");
    const sections = document.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickingTab.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionKey = entry.target.getAttribute("data-section");
            if (sectionKey) setActiveTab(sectionKey);
          }
        });
      },
      { root: mainEl, rootMargin: "-10% 0px -50% 0px", threshold: 0.1 }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [isLoading, enrollment]);

  const handleMobileTabClick = (key: string) => {
    isClickingTab.current = true;
    setActiveTab(key);

    const el = document.getElementById(`section-${key}`);
    const mainEl = document.querySelector("main");

    if (el && mainEl) {
      const mainRect = mainEl.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetY = mainEl.scrollTop + (elRect.top - mainRect.top) - 112;
      // Use instant scroll (no animation) so IntersectionObserver only fires once at destination.
      // smooth scroll causes Observer to detect intermediate sections as "active" → requires 2 clicks.
      mainEl.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
    }

    // Release lock shortly after – instant scroll fires events synchronously
    setTimeout(() => { isClickingTab.current = false; }, 200);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (!student) {
    return <div className="text-center py-20 text-slate-500">Murid tidak ditemukan.</div>;
  }

  const isCalistung = enrollment?.classes?.type === "calistung";

  const tabsList = [
    { key: "jadwal", label: "Jadwal", icon: Calendar },
    ...(!isCalistung ? [{ key: "hafalan", label: "Hafalan", icon: BookOpen }] : []),
    ...(!isCalistung ? [{ key: "murajaah", label: "Murajaah", icon: RefreshCw }] : []),
    { key: "iqro", label: "Iqro & Aisar", icon: BookMarked },
    { key: "tajwid", label: isCalistung ? "Calistung" : "Tajwid", icon: Award },
    { key: "catatan", label: "Catatan", icon: MessageSquare },
    { key: "raport", label: "Raport", icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ── DESKTOP VIEW (md:block) — ORIGINAL TAB SYSTEM ────────── */}
      <div className="hidden md:block space-y-6">
        {/* Back + Profile Header Desktop */}
        <div>
          <Link href="/guru/murid" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-4 transition">
            <ArrowLeft size={16} /> Kembali ke Daftar Murid
          </Link>
          <div className="bg-white rounded-2xl border border-slate-100/80 p-5 flex items-center gap-4 shadow-sm shadow-slate-100/50">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 border border-blue-100/30">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{student.full_name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {enrollment?.classes?.name ?? "Belum ada kelas"} •{" "}
                <span className={`font-bold ${enrollment?.status === "active" ? "text-emerald-600" : "text-slate-400"}`}>
                  {enrollment?.status ?? "-"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Tab Buttons */}
        <div className="flex gap-1 bg-slate-100/60 p-1 rounded-2xl border border-slate-200/20 overflow-x-auto scrollbar-hide">
          {tabsList.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-fit px-4 py-2.5 text-sm font-bold rounded-xl transition whitespace-nowrap ${activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-100/30"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Single Tab Content */}
        <div>
          {!enrollment ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
              Murid ini belum terdaftar di kelas manapun. Daftarkan via menu Owner terlebih dahulu.
            </div>
          ) : (
            <>
              {activeTab === "jadwal" && <TabJadwal enrollmentId={enrollment.id} />}
              {activeTab === "hafalan" && <TabHafalan enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />}
              {activeTab === "murajaah" && <TabMurajaah enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />}
              {activeTab === "iqro" && <TabIqro enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />}
              {activeTab === "tajwid" && (
                isCalistung
                  ? <TabCalistung enrollmentId={enrollment.id} guruId={guruId} />
                  : <TabTajwid enrollmentId={enrollment.id} guruId={guruId} />
              )}
              {activeTab === "catatan" && <TabCatatan enrollmentId={enrollment.id} guruId={guruId} />}
              {activeTab === "raport" && (
                <TabRaport
                  enrollmentId={enrollment.id}
                  guruId={guruId}
                  classType={(enrollment?.classes?.type as "calistung" | "tahfidz" | "umum") ?? "umum"}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE VIEW (md:hidden) — STICKY NAMA MURID + SCROLL NAVIGATION ── */}
      <div className="block md:hidden space-y-4">
        {/* 1. STICKY HEADER NAMA MURID */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm p-3 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/guru/murid"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition shrink-0"
              title="Kembali ke Daftar Murid"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-500/20">
              {student.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 truncate leading-tight">
                {student.full_name}
              </h1>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {enrollment?.classes?.name ?? "Belum ada kelas"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shrink-0">
            Detail Murid
          </span>
        </div>

        {/* 2. STICKY NAV BAR DI BAWAH NAMA MURID */}
        <div
          ref={mobileNavRef}
          className="sticky top-[58px] z-30 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-200/40 flex gap-1 overflow-x-auto scrollbar-hide"
        >
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                data-tab={tab.key}
                onClick={() => handleMobileTabClick(tab.key)}
                className={`flex items-center gap-1.5 flex-1 min-w-fit px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. MOBILE CONTINUOUS SCROLL SECTIONS */}
        {!enrollment ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            Murid ini belum terdaftar di kelas manapun. Daftarkan via menu Owner terlebih dahulu.
          </div>
        ) : (
          <div className="space-y-8 pt-2">
            {/* Section 1: Jadwal */}
            <section id="section-jadwal" data-section="jadwal" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Jadwal Belajar Murid</h2>
                  <p className="text-[11px] text-slate-400">Jadwal mingguan les/mengaji murid</p>
                </div>
              </div>
              <TabJadwal enrollmentId={enrollment.id} />
            </section>

            {/* Section 2: Hafalan (Non-calistung) */}
            {!isCalistung && (
              <section id="section-hafalan" data-section="hafalan" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">Progress Hafalan Al-Qur'an</h2>
                    <p className="text-[11px] text-slate-400">Pencapaian hafalan surat dan juz murid</p>
                  </div>
                </div>
                <TabHafalan enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />
              </section>
            )}

            {/* Section 3: Murajaah (Non-calistung) */}
            {!isCalistung && (
              <section id="section-murajaah" data-section="murajaah" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base">Sesi Murajaah (Pengulangan)</h2>
                    <p className="text-[11px] text-slate-400">Evaluasi pengulangan hafalan murid</p>
                  </div>
                </div>
                <TabMurajaah enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />
              </section>
            )}

            {/* Section 4: Iqro & Aisar */}
            <section id="section-iqro" data-section="iqro" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookMarked size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Modul Iqro & Aisar</h2>
                  <p className="text-[11px] text-slate-400">Perkembangan jilid dan kelancaran membaca</p>
                </div>
              </div>
              <TabIqro enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />
            </section>

            {/* Section 5: Tajwid / Calistung */}
            <section id="section-tajwid" data-section="tajwid" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Award size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">{isCalistung ? "Penilaian Calistung" : "Penilaian Tajwid & Makhraj"}</h2>
                  <p className="text-[11px] text-slate-400">Evaluasi teknis kemampuan murid</p>
                </div>
              </div>
              {isCalistung ? (
                <TabCalistung enrollmentId={enrollment.id} guruId={guruId} />
              ) : (
                <TabTajwid enrollmentId={enrollment.id} guruId={guruId} />
              )}
            </section>

            {/* Section 6: Catatan */}
            <section id="section-catatan" data-section="catatan" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Catatan & Pesan Guru</h2>
                  <p className="text-[11px] text-slate-400">Catatan perkembangan untuk wali murid</p>
                </div>
              </div>
              <TabCatatan enrollmentId={enrollment.id} guruId={guruId} />
            </section>

            {/* Section 7: Raport */}
            <section id="section-raport" data-section="raport" className="scroll-mt-28 bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-base">Raport Hasil Belajar</h2>
                  <p className="text-[11px] text-slate-400">Cetak dan tinjau raport periodik murid</p>
                </div>
              </div>
              <TabRaport
                enrollmentId={enrollment.id}
                guruId={guruId}
                classType={(enrollment?.classes?.type as "calistung" | "tahfidz" | "umum") ?? "umum"}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
