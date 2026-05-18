/**
 * components/raport/RaportTahfidz.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Template raport resmi untuk kelas TAHFIDZ (Hafalan Al-Qur'an & Tajwid).
 *
 * ✏️  Cara kustomisasi template ini:
 *  - Ubah bagian KOP LEMBAGA untuk sesuaikan nama & alamat bimbel
 *  - Tambah aspek penilaian baru di section "Tajwid & Adab"
 *  - Jangan ubah props interface RaportTemplateProps agar tetap kompatibel
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";

import { Format } from "@/lib/helpers";
import { NILAI_LABEL } from "@/types/raport";
import type { RaportTemplateProps, RaportDataTahfidz, NilaiLevel } from "@/types/raport";
import { BookOpen, Star, CheckCircle2, XCircle, Clock, MessageSquare, Mic } from "lucide-react";

function NilaiBadge({ level }: { level: NilaiLevel }) {
  const cfg = NILAI_LABEL[level] ?? NILAI_LABEL.belum;
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function HafalanStatusBadge({ status }: { status: 'lancar' | 'perlu_ulang' | 'dalam_proses' }) {
  const cfg = {
    lancar:        { label: 'Lancar',       icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    perlu_ulang:   { label: 'Perlu Ulang',  icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50'     },
    dalam_proses:  { label: 'Dalam Proses', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50'   },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function PenilaianRow({ label, level }: { label: string; level: NilaiLevel }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <NilaiBadge level={level} />
    </div>
  );
}

export default function RaportTahfidz({ raport, studentName, className, tenantName, guruName }: RaportTemplateProps) {
  const d = raport.data as RaportDataTahfidz;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans print:shadow-none print:border-slate-300">

      {/* ── KOP LEMBAGA ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-8 py-6 text-white text-center print:bg-slate-900">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-80 mb-1">Laporan Hasil Belajar</p>
        <h1 className="text-xl font-black tracking-tight">{tenantName}</h1>
        <p className="text-[11px] font-semibold opacity-70 mt-1">Program Tahfidz — Hafalan Al-Qur&apos;an & Tajwid</p>
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

        {/* ── DAFTAR HAFALAN ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl mb-3 bg-emerald-50 text-emerald-700">
            <BookOpen size={15} />
            <span className="text-xs font-black uppercase tracking-widest">Capaian Hafalan</span>
          </div>

          {(!d.hafalan_entries || d.hafalan_entries.length === 0) ? (
            <p className="text-xs text-slate-400 text-center py-4">Belum ada entri hafalan.</p>
          ) : (
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left">No</th>
                    <th className="py-2.5 px-4 text-left">Surah / Materi</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-left hidden sm:table-cell">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {d.hafalan_entries.map((entry, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{entry.surah_atau_materi}</td>
                      <td className="py-2.5 px-4 text-center">
                        <HafalanStatusBadge status={entry.status} />
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic hidden sm:table-cell">{entry.catatan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── PENILAIAN TAJWID ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl mb-3 bg-teal-50 text-teal-700">
            <Mic size={15} />
            <span className="text-xs font-black uppercase tracking-widest">Penilaian Tajwid & Adab</span>
          </div>
          <div className="px-2">
            <PenilaianRow label="Makharijul Huruf (Makhraj)" level={d.tajwid_makhraj} />
            <PenilaianRow label="Kelancaran Membaca" level={d.tajwid_kelancaran} />
            <PenilaianRow label="Kefasihan & Hukum Tajwid" level={d.tajwid_kefasihan} />
            <PenilaianRow label="Adab & Semangat Belajar" level={d.adab_belajar} />
          </div>
        </div>

        {/* ── NARASI GURU ────────────────────────────────────────────────── */}
        {d.narasi_guru && (
          <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-teal-600" />
              <span className="text-[10px] uppercase tracking-widest font-black text-teal-700">Catatan Guru</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{d.narasi_guru}&rdquo;</p>
          </div>
        )}

        {d.rekomendasi && (
          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Star size={13} className="text-amber-600" />
              <span className="text-[10px] uppercase tracking-widest font-black text-amber-700">Rekomendasi & Tindak Lanjut</span>
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
            <p className="font-bold mb-2">Guru Pembimbing</p>
            <div className="h-16 flex items-center justify-center my-1">
              {d?.signature ? (
                <img src={d.signature} alt="Tanda Tangan Guru" className="max-h-16 object-contain" />
              ) : (
                <div className="h-16" />
              )}
            </div>
            <div className="border-b border-slate-400 w-32 mx-auto" />
            <p className="text-[10px] text-slate-900 font-extrabold mt-1">{guruName || "Guru Pembimbing"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
