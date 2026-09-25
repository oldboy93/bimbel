"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, X, ChevronRight } from "lucide-react";
import { getClassLeaderboard, type LeaderboardEntry } from "@/services/leaderboardService";

interface LeaderboardWidgetProps {
  studentId: string;
  /** "sidebar" = tampil inline di sidebar desktop, "drawer" = tampil sebagai drawer mobile */
  variant: "sidebar" | "drawer";
  /** Hanya relevan untuk variant "drawer" */
  isOpen?: boolean;
  onClose?: () => void;
}

const MEDAL = ["🥇", "🥈", "🥉"];
const RANK_BG = [
  "bg-amber-50 border-amber-200",
  "bg-slate-50 border-slate-200",
  "bg-orange-50 border-orange-200",
];

function firstName(name: string) {
  return name.split(" ")[0];
}

export default function LeaderboardWidget({
  studentId,
  variant,
  isOpen,
  onClose,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  useEffect(() => {
    if (!studentId) return;
    const shouldLoad = variant === "sidebar" || isOpen;
    if (!shouldLoad) return;

    setIsLoading(true);
    getClassLeaderboard(studentId, 10).then((data) => {
      setEntries(data);
      setIsLoading(false);
    });
  }, [studentId, variant, isOpen]);

  // Kelas yang tersedia (untuk filter dropdown)
  const classOptions = [
    { id: "all", name: "Semua Kelas" },
    ...Array.from(new Map(entries.map((e) => [e.class_id, e.class_name])).entries()).map(
      ([id, name]) => ({ id, name })
    ),
  ];

  const filtered =
    selectedClass === "all" ? entries : entries.filter((e) => e.class_id === selectedClass);

  const content = (
    <div className={variant === "sidebar" ? "space-y-2" : "flex flex-col h-full min-h-0"}>
      {/* Drag handle pill — hanya di drawer */}
      {variant === "drawer" && (
        <div className="pt-3 pb-1 shrink-0 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
      )}

      {/* Header */}
      <div
        className={`flex items-center justify-between ${
          variant === "drawer" ? "px-5 pt-2 pb-3 border-b border-slate-100 shrink-0" : "mb-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <Trophy size={variant === "sidebar" ? 14 : 18} className="text-amber-500" />
          <span
            className={`font-extrabold text-slate-800 ${
              variant === "sidebar" ? "text-xs" : "text-sm"
            }`}
          >
            Murid Terajin
          </span>
        </div>
        {variant === "drawer" && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        )}
        {variant === "sidebar" && (
          <span className="text-[9px] text-slate-400 font-medium">30 hari</span>
        )}
      </div>

      {/* Class filter — hanya di drawer */}
      {variant === "drawer" && classOptions.length > 2 && (
        <div className="px-4 pb-2 pt-2 shrink-0">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400 text-slate-700"
          >
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Body */}
      <div
        className={`${
          variant === "drawer"
            ? "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6 space-y-2 pt-2"
            : "space-y-1.5"
        }`}
        style={variant === "drawer" ? { WebkitOverflowScrolling: "touch" } : undefined}
      >
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-amber-500" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-3 italic">
            Belum ada data setoran bulan ini.
          </p>
        ) : (
          (variant === "sidebar" ? filtered.slice(0, 5) : filtered).map((entry, idx) => {
            const isMe = entry.student_id === studentId;
            return (
              <div
                key={entry.student_id + entry.class_id}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border transition ${
                  idx < 3
                    ? RANK_BG[idx]
                    : isMe
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-slate-100"
                } ${variant === "drawer" ? "py-3" : ""}`}
              >
                {/* Rank */}
                <span
                  className={`shrink-0 ${
                    idx < 3
                      ? "text-base"
                      : `w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-extrabold ${
                          isMe
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`
                  }`}
                >
                  {idx < 3 ? MEDAL[idx] : idx + 1}
                </span>

                {/* Name + class */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-bold truncate ${
                      variant === "sidebar" ? "text-[11px]" : "text-xs"
                    } ${isMe ? "text-blue-700" : "text-slate-800"}`}
                  >
                    {firstName(entry.student_name)}
                    {isMe && (
                      <span className="ml-1 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-extrabold">
                        Kamu
                      </span>
                    )}
                  </p>
                  {variant === "drawer" && (
                    <p className="text-[10px] text-slate-400 truncate">{entry.class_name}</p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p
                    className={`font-extrabold ${
                      variant === "sidebar" ? "text-[11px]" : "text-xs"
                    } ${idx === 0 ? "text-amber-600" : "text-slate-600"}`}
                  >
                    {entry.score}
                  </p>
                  {variant === "drawer" && (
                    <p className="text-[9px] text-slate-400">
                      📖 {entry.total_setoran} · 🏫 {entry.attendance_rate}%
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {variant === "drawer" && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <p className="text-[10px] text-slate-400 text-center">
            Skor = 60% setoran + 40% kehadiran · 30 hari terakhir
          </p>
        </div>
      )}
    </div>
  );

  if (variant === "sidebar") {
    return (
      <div className="mx-4 mt-3 bg-amber-50/60 border border-amber-100 rounded-2xl p-3">
        {content}
      </div>
    );
  }

  // Drawer mobile
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[998] backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 bg-white z-[999] rounded-t-3xl shadow-2xl flex flex-col h-[82dvh] max-h-[85dvh] overflow-hidden"
      >
        {content}
      </div>
    </>
  );
}
