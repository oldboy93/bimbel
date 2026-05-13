"use client";
import { useEffect, useState } from "react";
import { tampilAbsensiMurid, simpanAbsensi, hitungStatistikAbsensi } from "@/services/attendanceService";
import type { Attendance } from "@/types";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Save } from "lucide-react";
import { ATTENDANCE_STATUS } from "@/lib/helpers";

const STATUS_CONFIG = {
  H: { label: "Hadir", icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300", selectedBg: "bg-emerald-500 text-white" },
  I: { label: "Ijin",  icon: AlertCircle,  bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-300",  selectedBg: "bg-yellow-400 text-white"  },
  A: { label: "Alpha", icon: XCircle,      bg: "bg-red-50",     text: "text-red-700",     border: "border-red-300",     selectedBg: "bg-red-500 text-white"     },
};

interface Props {
  enrollmentId: string;
  guruId: string;
  tenantId: string;
  studentPhone?: string;
  studentName?: string;
}

export default function TabKehadiran({ enrollmentId, guruId, tenantId, studentPhone, studentName }: Props) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"H" | "I" | "A">("H");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedToday, setSavedToday] = useState<Attendance | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const load = async () => {
    const data = await tampilAbsensiMurid(enrollmentId);
    setRecords(data);
    const todayRec = data.find(r => r.date === today);
    if (todayRec) { setSavedToday(todayRec); setSelectedStatus(todayRec.status); }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [enrollmentId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await simpanAbsensi(enrollmentId, guruId, tenantId, today, selectedStatus, notes);

      // Kirim WA jika ada nomor telepon wali siswa
      if (studentPhone) {
        const statusLabel = selectedStatus === "H" ? "HADIR 🟢" : selectedStatus === "I" ? "IZIN 🟡" : "ALPHA/TIDAK HADIR 🔴";
        const customNote = notes ? `\n\nCatatan guru:\n"${notes}"` : "";
        const msg = `Assalamu'alaikum Wr. Wb.\n\nBapak/Ibu Orang Tua/Wali Murid,\n\nKami menginformasikan bahwa ananda *${studentName}* hari ini dinyatakan *${statusLabel}* pada kelas bimbingan belajar.${customNote}\n\nJazakumullah khairan.\n— Bimbel Madani`;

        await fetch("/api/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: studentPhone, message: msg }),
        });
      }
    } catch (err) {
      console.error("Gagal mengirim notifikasi absensi:", err);
    }

    await load();
    setNotes("");
    setIsSaving(false);
  };

  const stat = hitungStatistikAbsensi(records);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      {/* Statistik */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", val: stat.total, color: "text-slate-900" },
          { label: "Hadir", val: stat.hadir, color: "text-emerald-600" },
          { label: "Ijin",  val: stat.ijin,  color: "text-yellow-600" },
          { label: "Alpha", val: stat.alpha, color: "text-red-500"    },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar kehadiran */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">Tingkat Kehadiran</span>
          <span className="text-sm font-black text-blue-600">{stat.persentase}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${stat.persentase >= 80 ? "bg-emerald-500" : stat.persentase >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ width: `${stat.persentase}%` }}
          />
        </div>
      </div>

      {/* Input Absensi Hari Ini */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">
          Absensi Hari Ini{" "}
          {savedToday && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1">✓ Sudah diisi</span>}
        </h3>
        <div className="flex gap-2 mb-3">
          {(["H", "I", "A"] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const isSelected = selectedStatus === s;
            return (
              <button key={s} onClick={() => setSelectedStatus(s)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition ${
                  isSelected ? cfg.selectedBg + " border-transparent" : `${cfg.bg} ${cfg.text} ${cfg.border}`
                }`}>
                {cfg.label}
              </button>
            );
          })}
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan (opsional)..."
          rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3" />
        <button onClick={handleSave} disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {savedToday ? "Perbarui Absensi" : "Simpan Absensi"}
        </button>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Riwayat Kehadiran</h3>
        {records.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat kehadiran.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {records.map(r => {
              const cfg = STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${cfg.bg}`}>
                  <span className="text-sm font-semibold text-slate-700">
                    {new Date(r.date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
