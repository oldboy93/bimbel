"use client";

import { useState, useEffect } from "react";
import { X, Star, BookOpen, Volume2, CheckCircle2, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { updateParentFeedbackHafalan } from "@/services/hafalanService";
import { updateParentFeedbackMurajaah } from "@/services/murajaahService";

export interface PrItem {
  type: "hafalan" | "murajaah";
  id: string;
  surah_name: string;
  surah_number?: number;
  ayat_reached?: number;
  total_ayat?: number;
  ayat_or_page_range?: string;
  pr_notes_guru?: string;
  parent_rating?: number | null;
  parent_status?: "lancar" | "cukup" | "perlu_bimbingan" | null;
  parent_notes?: string | null;
  parent_simak_at?: string | null;
  session_date: string;
}

interface ModalSimakPrProps {
  isOpen: boolean;
  item: PrItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onOpenMushaf: (surahNumber: number, highlightFrom?: number, highlightTo?: number) => void;
}

export default function ModalSimakPr({
  isOpen,
  item,
  onClose,
  onSuccess,
  onOpenMushaf,
}: ModalSimakPrProps) {
  const [rating, setRating] = useState<number>(5);
  const [status, setStatus] = useState<"lancar" | "cukup" | "perlu_bimbingan">("lancar");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (item) {
      setRating(item.parent_rating || 5);
      setStatus(item.parent_status || "lancar");
      setNotes(item.parent_notes || "");
      setErrorMsg("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (item.type === "hafalan") {
        await updateParentFeedbackHafalan({
          hafalanId: item.id,
          parentRating: rating,
          parentStatus: status,
          parentNotes: notes,
        });
      } else {
        await updateParentFeedbackMurajaah({
          murajaahId: item.id,
          parentRating: rating,
          parentStatus: status,
          parentNotes: notes,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan penilaian simakan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMushafHelper = () => {
    const sNum = item.surah_number && item.surah_number > 0 ? item.surah_number : 1;
    let from = 1;
    let to = item.ayat_reached || undefined;

    // Parse ayat range if murajaah (e.g. "Ayat 1-15")
    if (item.ayat_or_page_range) {
      const match = item.ayat_or_page_range.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (match) {
        from = parseInt(match[1], 10);
        to = parseInt(match[2], 10);
      }
    }

    onOpenMushaf(sNum, from, to);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-amber-50 rounded-2xl border border-amber-200">🏠</span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Simakan Orang Tua di Rumah
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {item.type === "hafalan" ? "Tugas Hafalan Baru" : "Tugas Muroja'ah"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informasi Penugasan dari Ustadz */}
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Materi Tugas</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">
                {item.surah_name} {item.ayat_or_page_range ? `(${item.ayat_or_page_range})` : ""}
              </h4>
              {item.type === "hafalan" && item.ayat_reached && item.total_ayat && (
                <p className="text-xs text-slate-600 font-medium">
                  Ayat 1 s.d. {item.ayat_reached} (dari {item.total_ayat} ayat)
                </p>
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium bg-white/80 px-2 py-1 rounded-lg border border-amber-100">
              {new Date(item.session_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          </div>

          {item.pr_notes_guru && (
            <div className="bg-white/90 p-3 rounded-xl border border-amber-200/60 text-xs text-slate-700">
              <strong className="text-amber-900 block mb-0.5">Pesan / Instruksi Guru:</strong>
              "{item.pr_notes_guru}"
            </div>
          )}

          {/* Tombol Pintasan Buka Mushaf & Audio */}
          <button
            type="button"
            onClick={handleOpenMushafHelper}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <BookOpen size={15} />
            <span>Buka Mushaf & Putar Audio Murottal Qari</span>
          </button>
        </div>

        {/* Form Penilaian Orang Tua */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              1. Kelancaran Bacaan Ananda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["lancar", "cukup", "perlu_bimbingan"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                    status === s
                      ? s === "lancar"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : s === "cukup"
                        ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                        : "bg-rose-500 border-rose-500 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {s === "lancar" ? "✨ Lancar" : s === "cukup" ? "👍 Cukup" : "💪 Perlu Bimbingan"}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Bintang */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              2. Penilaian Rating (1 - 5 Bintang)
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition text-2xl text-amber-400 focus:outline-none"
                  title={`${star} Bintang`}
                >
                  <Star
                    size={28}
                    fill={star <= rating ? "currentColor" : "none"}
                    className={star <= rating ? "text-amber-400" : "text-slate-300"}
                  />
                </button>
              ))}
              <span className="text-sm font-black text-slate-700 ml-2">
                {rating} / 5
              </span>
            </div>
          </div>

          {/* Catatan Orang Tua */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              3. Catatan Orang Tua / Wali (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Alhamdulillah ananda sudah hafal lancar, hanya sedikit ragu di ayat terakhir..."
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 resize-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Kirim Nilai ke Ustadz</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
