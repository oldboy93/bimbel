"use client";
import { useEffect, useState } from "react";
import { tampilJadwal, simpanJadwal, hapusJadwal } from "@/services/scheduleService";
import type { Schedule } from "@/types";
import { Loader2, Calendar, Plus, Trash2, Clock, Sparkles } from "lucide-react";
import { Format } from "@/lib/helpers";

interface Props { enrollmentId: string; }

export default function TabJadwal({ enrollmentId }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [activity, setActivity] = useState("");
  const [materialNotes, setMaterialNotes] = useState("");

  const load = () => {
    tampilJadwal(enrollmentId).then((d) => {
      setSchedules(d);
      setIsLoading(false);
    });
  };

  useEffect(() => { load(); }, [enrollmentId]);

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;
    setIsSaving(true);

    // Hitung day_of_week berdasarkan tanggal pertemuan
    const dateObj = new Date(sessionDate);
    const dayOfWeek = dateObj.getDay(); // 0 (Minggu) s/d 6 (Sabtu)

    // Simpan tanggal dalam format DATE:YYYY-MM-DD|NOTES:catatan di kolom material_notes
    const formattedNotes = `DATE:${sessionDate}|NOTES:${materialNotes}`;

    try {
      await simpanJadwal({
        enrollment_id: enrollmentId,
        day_of_week: dayOfWeek,
        activity,
        material_notes: formattedNotes,
        time_start: timeStart ? `${timeStart}:00` : undefined,
        time_end: timeEnd ? `${timeEnd}:00` : undefined
      });
      setShowForm(false);
      setActivity("");
      setMaterialNotes("");
      load();
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHapus = async (id: string) => {
    if (!confirm("Hapus jadwal pertemuan ini?")) return;
    try {
      await hapusJadwal(id);
      load();
    } catch (err: any) {
      alert("Gagal menghapus jadwal: " + err.message);
    }
  };

  // Helper untuk parsing info custom session
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

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  // Pisahkan pertemuan kustom (per-murid) dan jadwal rutin lama
  const customSessions = schedules
    .map(s => ({ ...s, parsed: parseSession(s) }))
    .filter(s => s.parsed.isCustom)
    .sort((a, b) => new Date(b.parsed.date!).getTime() - new Date(a.parsed.date!).getTime());

  const regularSchedules = schedules
    .map(s => ({ ...s, parsed: parseSession(s) }))
    .filter(s => !s.parsed.isCustom);

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition">
        <Plus size={18} /> Buat Pertemuan Baru
      </button>

      {showForm && (
        <form onSubmit={handleSimpan} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={18} /> Atur Pertemuan Baru
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Tanggal</label>
              <input type="date" required value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Jam Mulai</label>
              <input type="time" required value={timeStart} onChange={e => setTimeStart(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Jam Selesai</label>
              <input type="time" required value={timeEnd} onChange={e => setTimeEnd(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Fokus Aktivitas / Materi</label>
            <input type="text" required value={activity} onChange={e => setActivity(e.target.value)}
              placeholder="Contoh: Belajar Membaca Iqro 3, Setoran Hafalan Baru, dll."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Catatan Tambahan (Opsional)</label>
            <input type="text" value={materialNotes} onChange={e => setMaterialNotes(e.target.value)}
              placeholder="Contoh: Halaman 10 s/d 12"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 text-slate-500 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition text-sm">Batal</button>
            <button type="submit" disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-sm disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Simpan Pertemuan"}
            </button>
          </div>
        </form>
      )}

      {/* Bagian Pertemuan Per Murid */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14} /> Daftar Pertemuan Murid</h4>

        {customSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            <Calendar className="mx-auto mb-2 text-slate-300" size={28} />
            <p className="text-xs font-bold">Belum ada pertemuan terjadwal.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Gunakan tombol di atas untuk menjadwalkan pertemuan.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {customSessions.map((s) => {
              const formattedDate = Format.tanggalIndo(s.parsed.date!);
              const startStr = s.time_start ? s.time_start.slice(0, 5) : "";
              const endStr = s.time_end ? s.time_end.slice(0, 5) : "";

              return (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 text-sm">{s.activity}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs font-semibold text-slate-500">
                      <span>📅 {formattedDate}</span>
                      {startStr && <span className="flex items-center gap-1"><Clock size={12} /> {startStr} - {endStr} WIB</span>}
                    </div>
                    {s.parsed.notes && (
                      <p className="text-xs text-slate-400 mt-1 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50 italic">
                        &ldquo;{s.parsed.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleHapus(s.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
