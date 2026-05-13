"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Award, Loader2, Calendar, AlertCircle, Sparkles,
  TrendingUp, ThumbsUp, Printer, CheckCircle2
} from "lucide-react";
import { tampilEnrollmentMurid } from "@/services/studentService";
import { tampilRaport, tampilAssessmentTajwid } from "@/services/gradeService";
import { Format, TAJWID_LEVELS, PROGRAM_TYPES } from "@/lib/helpers";
import type { EnrollmentWithDetails, ReportCard, TajwidAssessment } from "@/types";

export default function MuridRaportPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [selectedEnr, setSelectedEnr] = useState<EnrollmentWithDetails | null>(null);
  const [raports, setRaports] = useState<ReportCard[]>([]);
  const [tajwids, setTajwids] = useState<TajwidAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const supabase = createClient();

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load enrollments & profile
  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        const enrData = await tampilEnrollmentMurid(user.id);
        setEnrollments(enrData);
        if (enrData.length > 0) {
          setSelectedEnr(enrData[0]);
        }
      } catch (err) {
        console.error("Gagal memuat enrollment raport:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEnrollments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load raports & tajwids when selected enrollment changes
  useEffect(() => {
    if (!selectedEnr) return;

    const loadSubData = async () => {
      setIsSubLoading(true);
      try {
        const [raportData, tajwidData] = await Promise.all([
          tampilRaport(selectedEnr.id).catch(() => []),
          tampilAssessmentTajwid(selectedEnr.id).catch(() => [])
        ]);

        const publishedRaports = raportData.filter((r) => r.published_at !== null);
        setRaports(publishedRaports);
        setTajwids(tajwidData);
      } catch (err) {
        console.error("Gagal memuat sub-data raport:", err);
      } finally {
        setIsSubLoading(false);
      }
    };

    loadSubData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnr]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat data penilaian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSS Khusus untuk Mode Cetak Media Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* ── Header ── */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Raport Belajar <Award className="text-blue-600 h-6 w-6" />
          </h1>
          <p className="text-slate-500 mt-2">Dapatkan rekapitulasi penilaian berkala, tingkat perkembangan membaca, tajwid, dan cetak raport PDF resmi.</p>
        </div>
        {raports.length > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm w-fit"
          >
            <Printer size={16} />
            Cetak Raport PDF
          </button>
        )}
      </header>

      {/* ── Selektor Kelas ── */}
      {enrollments.length > 1 && (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit no-print">
          {enrollments.map((enr) => (
            <button
              key={enr.id}
              onClick={() => setSelectedEnr(enr)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                selectedEnr?.id === enr.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {enr.classes?.name ?? "Kelas"}
            </button>
          ))}
        </div>
      )}

      {/* ── Konten Utama Raport ── */}
      {!selectedEnr ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 no-print">
          <AlertCircle size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Kamu belum terdaftar di kelas manapun</p>
            <p className="text-sm text-amber-700 mt-1">Silakan hubungi ustadz untuk mendaftarkan kamu agar penilaian raport dapat diakses.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bagian Raport Berkala */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 no-print">
              <Sparkles className="text-blue-600" size={20} /> Raport Prestasi
            </h2>

            {isSubLoading ? (
              <div className="flex justify-center items-center py-20 no-print">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : raports.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 shadow-sm no-print">
                <Award className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                <p className="font-bold text-sm text-slate-500">Raport belum diterbitkan</p>
                <p className="text-xs text-slate-400 mt-1">Ustadz/Ustadzah sedang mengolah raport prestasi belajarmu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {raports.map((r) => (
                  <div key={r.id} id="print-area" ref={printAreaRef} className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
                    {/* KOP LEMBAGA (Hanya Terlihat Saat Cetak & Tampilan Atas) */}
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                        Lembaga Pendidikan Al-Qur&apos;an & Calistung
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Jl. Pendidikan No. 45, Komplek Bimbel Madani • Telp: 0812-3456-789</p>
                    </div>

                    {/* Informasi Siswa */}
                    <div className="grid grid-cols-2 gap-4 text-xs md:text-sm text-slate-700 border-b border-slate-100 pb-4">
                      <div>
                        <p className="mb-1"><span className="text-slate-400 font-semibold block uppercase text-[10px]">Nama Murid:</span> <span className="font-extrabold text-slate-900">{profile?.full_name || "Siswa"}</span></p>
                        <p><span className="text-slate-400 font-semibold block uppercase text-[10px]">Kelas Belajar:</span> <span className="font-extrabold text-slate-900">{selectedEnr.classes?.name || "-"}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="mb-1"><span className="text-slate-400 font-semibold block uppercase text-[10px]">Periode:</span> <span className="font-extrabold text-slate-900">{r.period}</span></p>
                        <p><span className="text-slate-400 font-semibold block uppercase text-[10px]">Tanggal Terbit:</span> <span className="font-extrabold text-slate-900">{r.published_at ? Format.tanggalIndo(r.published_at) : "-"}</span></p>
                      </div>
                    </div>

                    <div className="text-center my-4">
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-widest border-b border-slate-900 pb-1.5 w-fit mx-auto">
                        Laporan Hasil Belajar (Raport)
                      </h3>
                    </div>

                    {/* Nilai Detail Table */}
                    {r.scores && Object.keys(r.scores).length > 0 && (
                      <div className="space-y-3">
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs md:text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-4">No</th>
                                <th className="py-3 px-4">Aspek Penilaian</th>
                                <th className="py-3 px-4 text-center">Nilai Angka</th>
                                <th className="py-3 px-4 text-center">Predikat</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {Object.entries(r.scores).map(([aspek, skor], idx) => (
                                <tr key={aspek}>
                                  <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800 capitalize">{aspek.replace("_", " ")}</td>
                                  <td className="py-3 px-4 text-center font-black text-slate-900">{skor}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="font-extrabold text-xs">
                                      {skor >= 85 ? "Sangat Baik (A)" :
                                       skor >= 75 ? "Baik (B)" :
                                       skor >= 60 ? "Cukup (C)" : "Kurang (D)"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Kesimpulan Ringkasan */}
                    {r.summary && (
                      <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100 space-y-1">
                        <span className="text-blue-900 font-extrabold text-xs block uppercase tracking-wider">Catatan & Saran Perkembangan:</span>
                        <p className="text-blue-800 text-sm leading-relaxed italic">
                          &ldquo;{r.summary}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Tanda Tangan */}
                    <div className="grid grid-cols-2 text-center text-xs md:text-sm font-semibold text-slate-800 pt-8 border-t border-slate-100 gap-10">
                      <div>
                        <p className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Mengetahui,</p>
                        <p className="font-bold mb-14">Orang Tua / Wali Murid</p>
                        <p className="border-b border-slate-400 w-36 mx-auto"></p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Diterbitkan Oleh,</p>
                        <p className="font-bold mb-14">Ustadz / Ustadzah</p>
                        <p className="border-b border-slate-400 w-36 mx-auto font-extrabold text-slate-900">{r.guru_id ? "Guru Pembimbing" : ""}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian Penilaian Tajwid */}
          <div className="lg:col-span-1 space-y-4 no-print">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} /> Penilaian Tajwid
            </h2>

            {isSubLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : tajwids.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 shadow-sm">
                <Calendar className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                <p className="font-bold text-xs text-slate-500">Belum ada penilaian membaca</p>
              </div>
            ) : (
              tajwids.slice(0, 3).map((t) => (
                <div key={t.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                    <span className="text-xs font-extrabold text-slate-400">{Format.tanggalIndo(t.session_date)}</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <ThumbsUp size={14} />
                    </span>
                  </div>

                  <div className="space-y-3 text-sm">
                    {/* Makhraj */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-600 text-xs">Makharijul Huruf</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        TAJWID_LEVELS[t.makhraj_level]?.bg
                      } ${TAJWID_LEVELS[t.makhraj_level]?.color}`}>
                        {TAJWID_LEVELS[t.makhraj_level]?.label}
                      </span>
                    </div>

                    {/* Kelancaran */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-600 text-xs">Kelancaran Membaca</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        TAJWID_LEVELS[t.kelancaran_level]?.bg
                      } ${TAJWID_LEVELS[t.kelancaran_level]?.color}`}>
                        {TAJWID_LEVELS[t.kelancaran_level]?.label}
                      </span>
                    </div>

                    {/* Tajwid */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-600 text-xs">Hukum Tajwid</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        TAJWID_LEVELS[t.tajwid_level]?.bg
                      } ${TAJWID_LEVELS[t.tajwid_level]?.color}`}>
                        {TAJWID_LEVELS[t.tajwid_level]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
