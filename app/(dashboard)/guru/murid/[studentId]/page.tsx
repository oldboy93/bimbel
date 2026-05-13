"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tampilEnrollmentMurid, tampilMurid } from "@/services/studentService";
import { Loader2, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Profile, EnrollmentWithDetails } from "@/types";

// Tab Components
import TabJadwal from "./TabJadwal";
import TabKehadiran from "./TabKehadiran";
import TabHafalan from "./TabHafalan";
import TabTajwid from "./TabTajwid";
import TabCatatan from "./TabCatatan";

const TABS = [
  { key: "jadwal",   label: "Jadwal"   },
  { key: "kehadiran",label: "Kehadiran"},
  { key: "hafalan",  label: "Hafalan"  },
  { key: "tajwid",   label: "Tajwid"   },
  { key: "catatan",  label: "Catatan"  },
];

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [activeTab, setActiveTab] = useState("jadwal");
  const [student, setStudent] = useState<Profile | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [guruId, setGuruId] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (!student) {
    return <div className="text-center py-20 text-slate-500">Murid tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back + Profile Header */}
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

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100/60 p-1 rounded-2xl border border-slate-200/20 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-fit px-4 py-2.5 text-sm font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm border border-slate-100/30"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {!enrollment ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
            Murid ini belum terdaftar di kelas manapun. Daftarkan via menu Owner terlebih dahulu.
          </div>
        ) : (
          <>
            {activeTab === "jadwal"    && <TabJadwal    enrollmentId={enrollment.id} />}
            {activeTab === "kehadiran" && <TabKehadiran  enrollmentId={enrollment.id} guruId={guruId} tenantId={tenantId} studentPhone={student.phone || ""} studentName={student.full_name} />}
            {activeTab === "hafalan"   && <TabHafalan    enrollmentId={enrollment.id} guruId={guruId} studentPhone={student.phone || ""} studentName={student.full_name} />}
            {activeTab === "tajwid"    && <TabTajwid     enrollmentId={enrollment.id} guruId={guruId} />}
            {activeTab === "catatan"   && <TabCatatan    enrollmentId={enrollment.id} guruId={guruId} />}
          </>
        )}
      </div>
    </div>
  );
}
