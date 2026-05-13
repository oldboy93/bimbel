"use client";
import { useEffect, useState } from "react";
import { tampilJadwal } from "@/services/scheduleService";
import { namaHari } from "@/services/scheduleService";
import type { Schedule } from "@/types";
import { Loader2, Calendar } from "lucide-react";

const DAY_NAMES_ID = ["Minggu","Senin","Selasa","Rabu","Kamis","Jum'at","Sabtu"];
const todayIndex = new Date().getDay();

export default function TabJadwal({ enrollmentId }: { enrollmentId: string }) {
  const [jadwal, setJadwal] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tampilJadwal(enrollmentId).then((d) => { setJadwal(d); setIsLoading(false); });
  }, [enrollmentId]);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;

  if (jadwal.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
        <Calendar className="mx-auto mb-3 text-slate-300" size={36} />
        <p>Jadwal belum diatur untuk murid ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jadwal.map((j) => {
        const isToday = j.day_of_week === todayIndex;
        return (
          <div key={j.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition ${
              isToday ? "border-blue-200 bg-blue-50/40 shadow-sm" : "border-slate-100"
            }`}>
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
              isToday ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              <span className="text-xs font-semibold">{DAY_NAMES_ID[j.day_of_week]}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{j.activity}</p>
              {j.material_notes && <p className="text-sm text-slate-500 mt-0.5">{j.material_notes}</p>}
              {(j.time_start || j.time_end) && (
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  {j.time_start} – {j.time_end} WIB
                </p>
              )}
            </div>
            {isToday && (
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-600 text-white rounded-full">Hari Ini</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
