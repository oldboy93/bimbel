"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { tampilSemuaEnrollment } from "@/services/studentService";
import type { EnrollmentWithDetails } from "@/types";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Save, CalendarCheck } from "lucide-react";

type Status = "H" | "I" | "A";

const STATUS_CONFIG: Record<Status, { label: string; short: string; selectedClass: string; idleClass: string }> = {
  H: { label: "Hadir", short: "H", selectedClass: "bg-emerald-500 text-white border-emerald-500", idleClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  I: { label: "Ijin",  short: "I", selectedClass: "bg-yellow-400 text-white border-yellow-400", idleClass: "bg-yellow-50 text-yellow-700 border-yellow-200"  },
  A: { label: "Alpha", short: "A", selectedClass: "bg-red-500 text-white border-red-500",      idleClass: "bg-red-50 text-red-700 border-red-200"          },
};

export default function AbsensiHarianPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [guruId, setGuruId] = useState("");
  const [tenantId, setTenantId] = useState("");

  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const todayLabel = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setGuruId(user.id);

      const data = await tampilSemuaEnrollment();
      setEnrollments(data);

      // Default semua Hadir
      const defaultStatuses: Record<string, Status> = {};
      data.forEach(e => { defaultStatuses[e.id] = "H"; });
      setStatuses(defaultStatuses);

      if (data[0]) setTenantId(data[0].tenant_id);
      setIsLoading(false);
    };
    load();
  }, []);

  const classList = Array.from(
    new Map(enrollments.map(e => [e.class_id, e.classes?.name ?? "-"])).entries()
  );

  const filtered = selectedClass === "all"
    ? enrollments
    : enrollments.filter(e => e.class_id === selectedClass);

  const setAllStatus = (s: Status) => {
    const updated = { ...statuses };
    filtered.forEach(e => { updated[e.id] = s; });
    setStatuses(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedCount(0);
    let count = 0;
    for (const enr of filtered) {
      const status = statuses[enr.id] ?? "H";
      await supabase.from("attendances").upsert(
        { enrollment_id: enr.id, guru_id: guruId, tenant_id: tenantId, date: today, status },
        { onConflict: "enrollment_id,date" }
      );
      count++;
    }
    setSavedCount(count);
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <CalendarCheck className="text-blue-600 h-8 w-8" /> Absensi Harian
        </h1>
        <p className="text-slate-500 mt-1">{todayLabel}</p>
      </div>

      {/* Filter Kelas */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedClass("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${selectedClass === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
          Semua Kelas
        </button>
        {classList.map(([id, name]) => (
          <button key={id} onClick={() => setSelectedClass(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${selectedClass === id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
            {name}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-slate-500 font-medium mr-1">Tandai semua:</span>
        {(["H", "I", "A"] as Status[]).map(s => (
          <button key={s} onClick={() => setAllStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${STATUS_CONFIG[s].idleClass}`}>
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Absensi List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          Tidak ada murid di kelas ini.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((enr) => {
            const current = statuses[enr.id] ?? "H";
            return (
              <div key={enr.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold shrink-0">
                    {enr.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{enr.profiles?.full_name ?? "-"}</p>
                    <p className="text-xs text-slate-400">{enr.classes?.name}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(["H", "I", "A"] as Status[]).map(s => (
                    <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [enr.id]: s }))}
                      className={`w-11 h-9 rounded-xl text-xs font-black border-2 transition ${
                        current === s ? STATUS_CONFIG[s].selectedClass : "bg-white text-slate-300 border-slate-200 hover:border-slate-300"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {filtered.length > 0 && (
        <div className="sticky bottom-4">
          <button onClick={handleSave} disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-bold text-base rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition shadow-lg shadow-blue-500/25 disabled:opacity-50">
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? "Menyimpan..." : `Simpan Absensi ${filtered.length} Murid`}
          </button>
          {savedCount > 0 && (
            <p className="text-center text-sm text-emerald-600 font-semibold mt-2">
              ✓ {savedCount} absensi berhasil disimpan!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
