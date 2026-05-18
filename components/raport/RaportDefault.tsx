/**
 * components/raport/RaportDefault.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Template raport UMUM/DEFAULT untuk jenis kelas yang belum memiliki
 * template khusus (misalnya: Bahasa Inggris, Matematika, dll).
 *
 * ✏️  Cara menambahkan template baru:
 *  1. Buat file RaportNamaKelas.tsx di folder ini
 *  2. Definisikan tipe data di types/raport.ts
 *  3. Daftarkan di RaportRenderer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";

import { Format } from "@/lib/helpers";
import { NILAI_LABEL } from "@/types/raport";
import type { RaportTemplateProps, RaportDataUmum, NilaiLevel } from "@/types/raport";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";

function NilaiBadge({ level }: { level: NilaiLevel }) {
  const cfg = NILAI_LABEL[level] ?? NILAI_LABEL.belum;
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function RaportDefault({ raport, studentName, className, tenantName, guruName }: RaportTemplateProps) {
  const d = raport.data as RaportDataUmum;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans print:shadow-none print:border-slate-300">

      {/* ── KOP LEMBAGA ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-8 py-6 text-white text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-80 mb-1">Laporan Hasil Belajar</p>
        <h1 className="text-xl font-black tracking-tight">{tenantName}</h1>
        <p className="text-[11px] font-semibold opacity-70 mt-1">Program {className}</p>
      </div>

      <div className="p-6 md:p-8 space-y-6">

        {/* ── INFO MURID ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 text-xs">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Nama Murid</p>
              <p className="font-extrabold text-slate-900 text-sm">{studentName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Kelas</p>
              <p className="font-bold text-slate-700">{className}</p>
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Periode</p>
              <p className="font-extrabold text-slate-900 text-sm">{raport.period}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tanggal Terbit</p>
              <p className="font-bold text-slate-700">
                {raport.published_at ? Format.tanggalIndo(raport.published_at) : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* ── PENILAIAN ASPEK ─────────────────────────────────────────────── */}
        {d.aspek_penilaian && d.aspek_penilaian.length > 0 && (
          <div>
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl mb-3 bg-slate-100 text-slate-700">
              <Star size={15} />
              <span className="text-xs font-black uppercase tracking-widest">Penilaian</span>
            </div>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left">No</th>
                    <th className="py-2.5 px-4 text-left">Aspek Penilaian</th>
                    <th className="py-2.5 px-4 text-center">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {d.aspek_penilaian.map((aspek, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{aspek.nama}</td>
                      <td className="py-2.5 px-4 text-center">
                        <NilaiBadge level={aspek.nilai} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── NARASI GURU ────────────────────────────────────────────────── */}
        {d.narasi_guru && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-slate-600" />
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-600">Catatan Guru</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{d.narasi_guru}&rdquo;</p>
          </div>
        )}

        {d.rekomendasi && (
          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={13} className="text-amber-600" />
              <span className="text-[10px] uppercase tracking-widest font-black text-amber-700">Rekomendasi</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{d.rekomendasi}</p>
          </div>
        )}

        {/* ── TANDA TANGAN ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 text-center text-xs font-semibold text-slate-700 pt-6 border-t border-slate-100 gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Mengetahui</p>
            <p className="font-bold mb-14">Orang Tua / Wali Murid</p>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <p className="text-[10px] text-slate-400 mt-1">(.......................................)</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Diterbitkan Oleh</p>
            <p className="font-bold mb-14">Guru Pembimbing</p>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <p className="text-[10px] text-slate-900 font-extrabold mt-1">{guruName || "Guru Pembimbing"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
