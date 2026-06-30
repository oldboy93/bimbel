"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Award, Loader2, AlertCircle, Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { tampilEnrollmentMurid } from "@/services/studentService";
import type { EnrollmentWithDetails } from "@/types";
import type { RaportEntry } from "@/types/raport";
import RaportRenderer from "@/components/raport/RaportRenderer";

export default function MuridRaportPage() {
  const [profile, setProfile] = useState<{ full_name: string; tenant_id: string } | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [guruName, setGuruName] = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [selectedEnr, setSelectedEnr] = useState<EnrollmentWithDetails | null>(null);
  const [raports, setRaports] = useState<RaportEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const supabase = createClient();

  // Load profile, tenant, enrollments
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const activeStudentId = localStorage.getItem("active_student_id") || user.id;

        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, tenant_id")
          .eq("id", activeStudentId)
          .single();
        setProfile(prof);

        // Fetch tenant name
        if (prof?.tenant_id) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("name")
            .eq("id", prof.tenant_id)
            .single();
          if (tenant?.name) setTenantName(tenant.name);
        }

        const enrData = await tampilEnrollmentMurid(activeStudentId);
        setEnrollments(enrData);
        if (enrData.length > 0) setSelectedEnr(enrData[0]);
      } catch (err) {
        console.error("Gagal memuat raport page:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load raports when enrollment changes
  useEffect(() => {
    if (!selectedEnr) return;
    const loadRaports = async () => {
      setIsSubLoading(true);
      try {
        const { data } = await supabase
          .from("report_cards")
          .select("*, profiles!guru_id(full_name)")
          .eq("enrollment_id", selectedEnr.id)
          .not("published_at", "is", null)
          .order("created_at", { ascending: false });

        setRaports((data ?? []) as RaportEntry[]);

        // Ambil nama guru dari raport pertama jika ada
        if (data && data.length > 0 && (data[0] as { profiles?: { full_name?: string } }).profiles?.full_name) {
          setGuruName(((data[0] as { profiles?: { full_name?: string } }).profiles)?.full_name ?? "Guru Pembimbing");
        }
      } catch (err) {
        console.error("Gagal memuat raport:", err);
      } finally {
        setIsSubLoading(false);
      }
    };
    loadRaports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnr]);

  const handleDownload = (raportId: string, periodName: string) => {
    const originalElement = document.getElementById(`raport-card-${raportId}`);
    if (!originalElement) return;

    setIsDownloading(raportId);

    // Create off-screen container for perfect print layout
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "746px"; // Mathematical fit for A4 with 0.25in margins at 96 DPI
    document.body.appendChild(tempContainer);

    // Clone the original element
    const clone = originalElement.cloneNode(true) as HTMLElement;
    
    // Remove the print control bar from the clone so it doesn't appear in the PDF
    const controlBar = clone.querySelector(".print\\:hidden");
    if (controlBar) {
      controlBar.remove();
    }

    // Ensure the clone is visible for canvas capture even if accordion is closed
    clone.classList.remove("hidden");
    clone.style.display = "block";
    clone.style.width = "746px";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.boxShadow = "none";
    clone.style.border = "none";
    clone.style.borderRadius = "0px";

    // Optimize spacing inside clone to guarantee single page fit
    const innerContainer = clone.querySelector(".p-6, .md\\:p-8, .p-4") as HTMLElement;
    if (innerContainer) {
      innerContainer.style.padding = "12px 16px";
    }

    // Shrink header Kop Lembaga
    const header = clone.querySelector(".bg-gradient-to-r") as HTMLElement;
    if (header) {
      header.style.padding = "8px 12px";
      const title = header.querySelector("h1") as HTMLElement;
      if (title) title.style.fontSize = "15px";
      const subtitles = header.querySelectorAll("p");
      subtitles.forEach((p) => {
        (p as HTMLElement).style.fontSize = "8.5px";
      });
    }

    // Shrink student info grid box
    const infoBox = clone.querySelector(".grid-cols-2.bg-slate-50") as HTMLElement;
    if (infoBox) {
      infoBox.style.padding = "4px 8px";
      infoBox.style.borderRadius = "8px";
      infoBox.style.gap = "6px";
    }

    // Shrink spacing gaps
    const spaces = clone.querySelectorAll(".space-y-6");
    spaces.forEach((el) => {
      el.classList.remove("space-y-6");
      el.classList.add("space-y-2");
    });

    // Shrink section title badges
    const secHeaders = clone.querySelectorAll(".py-2.px-3.rounded-xl, .bg-emerald-50, .bg-teal-50, .bg-blue-50, .bg-indigo-50");
    secHeaders.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.padding = "3px 6px";
      htmlEl.style.marginBottom = "3px";
      htmlEl.style.borderRadius = "6px";
    });

    // Shrink penilaian rows
    const rows = clone.querySelectorAll(".py-2.border-b");
    rows.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.paddingTop = "1px";
      htmlEl.style.paddingBottom = "1px";
    });

    // Shrink notes boxes (Catatan Guru, Rekomendasi)
    const noteBoxes = clone.querySelectorAll(".p-4.rounded-2xl, .bg-blue-50\\/60, .bg-amber-50\\/60, .bg-teal-50\\/60");
    noteBoxes.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.padding = "5px 8px";
      htmlEl.style.borderRadius = "8px";
    });

    // Tighten signature margins to prevent overflow page breaks
    const signatureText = clone.querySelectorAll(".mb-14, .mb-7");
    signatureText.forEach((el) => {
      (el as HTMLElement).style.marginBottom = "8px";
    });

    const borderGap = clone.querySelector(".pt-6.border-t") as HTMLElement;
    if (borderGap) {
      borderGap.classList.remove("pt-6");
      borderGap.style.paddingTop = "6px";
      borderGap.style.marginTop = "6px";
    }

    tempContainer.appendChild(clone);

    const opt = {
      margin:       0.25,
      filename:     `Raport_${profile?.full_name ?? "Murid"}_${periodName.replace(/\s+/g, "_")}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Dynamically load html2pdf
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      (window as any).html2pdf().from(clone).set(opt).save().then(() => {
        document.body.removeChild(tempContainer);
        setIsDownloading(null);
      }).catch((err: any) => {
        console.error(err);
        document.body.removeChild(tempContainer);
        setIsDownloading(null);
      });
    };
    script.onerror = () => {
      document.body.removeChild(tempContainer);
      setIsDownloading(null);
      console.error("Gagal memuat sistem PDF download.");
    };
    document.body.appendChild(script);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat data raport...</p>
        </div>
      </div>
    );
  }

  const activeRaportId = expandedId || (raports.length > 0 ? raports[0].id : null);
  const activePeriod = raports.find(r => r.id === activeRaportId)?.period ?? "Periode";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Raport Belajar <Award className="text-blue-600 h-6 w-6" />
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-semibold">
            Lihat laporan hasil belajar yang telah diterbitkan oleh guru pembimbing.
          </p>
        </div>
      </header>

      {/* ── Selektor Kelas ── */}
      {enrollments.length > 1 && (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
          {enrollments.map(enr => (
            <button
              key={enr.id}
              onClick={() => { setSelectedEnr(enr); setExpandedId(null); }}
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

      {/* ── Konten ── */}
      {!selectedEnr ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Kamu belum terdaftar di kelas manapun</p>
            <p className="text-sm text-amber-700 mt-1">Silakan hubungi ustadz/ustadzah untuk didaftarkan ke kelas.</p>
          </div>
        </div>
      ) : isSubLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : raports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-200 mb-3" />
          <p className="font-bold text-sm text-slate-500">Belum ada raport yang diterbitkan</p>
          <p className="text-xs text-slate-400 mt-1">Guru pembimbing sedang mempersiapkan raport belajarmu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {raports.map((r, idx) => (
            <div key={r.id}>
              {/* Accordion header — clean toggle expand/collapse */}
              <div
                className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-3.5 cursor-pointer hover:bg-slate-50/50 shadow-sm transition mb-2"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <Award size={16} className="text-blue-600" />
                  <div>
                    <p className="font-black text-sm text-slate-800">{r.period}</p>
                    <p className="text-[11px] text-slate-400 font-semibold capitalize">{r.class_type} · {selectedEnr.classes?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-50 text-slate-400 px-2.5 py-1 rounded-lg font-bold border border-slate-100">
                    {expandedId === r.id ? "Terbuka" : "Tertutup"}
                  </span>
                  {expandedId === r.id
                    ? <ChevronUp size={15} className="text-slate-400" />
                    : <ChevronDown size={15} className="text-slate-400" />}
                </div>
              </div>

              {/* Template rendered — always in DOM but hidden visually for print targeting */}
              <div
                id={`raport-card-${r.id}`}
                className={`bg-white rounded-3xl p-1 shadow-sm border border-slate-100 transition-all duration-300 ${
                  expandedId === r.id
                    ? "block"
                    : "hidden"
                }`}
              >
                {/* Print Control Bar (Hidden during PDF generation) */}
                <div className="flex justify-between items-center px-6 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-3xl print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-600">Raport Semester Resmi • {r.period}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(r.id, r.period)}
                    disabled={isDownloading !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                  >
                    {isDownloading === r.id ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={13} /> Unduh PDF Raport
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4">
                  <RaportRenderer
                    raport={r}
                    studentName={profile?.full_name ?? "Murid"}
                    className={selectedEnr.classes?.name ?? "-"}
                    tenantName={tenantName || "Lembaga Bimbel"}
                    guruName={guruName}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
