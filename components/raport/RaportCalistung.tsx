/**
 * components/raport/RaportCalistung.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Template raport resmi untuk kelas CALISTUNG (Membaca, Menulis, Berhitung).
 *
 * ✏️  Cara kustomisasi template ini:
 *  - Ubah bagian KOP LEMBAGA untuk sesuaikan nama & alamat bimbel
 *  - Tambah/kurangi baris di section penilaian sesuai kurikulum
 *  - Jangan ubah props interface RaportTemplateProps agar tetap kompatibel
 * ─────────────────────────────────────────────────────────────────────────────
 */
"use client";

import { Format } from "@/lib/helpers";
import { NILAI_LABEL } from "@/types/raport";
import type { RaportTemplateProps, RaportDataCalistung, NilaiLevel } from "@/types/raport";
import { CheckCircle2, BookOpen, PenLine, Calculator, MessageSquare } from "lucide-react";

function NilaiBadge({ level }: { level: NilaiLevel }) {
  const cfg = NILAI_LABEL[level] ?? NILAI_LABEL.belum;
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 py-2 px-3 rounded-xl mb-3 ${color}`}>
      <Icon size={15} />
      <span className="text-xs font-black uppercase tracking-widest">{title}</span>
    </div>
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

export default function RaportCalistung({ raport, studentName, className, tenantName, guruName }: RaportTemplateProps) {
  const d = raport.data as RaportDataCalistung;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans print:shadow-none print:border-slate-300">

      {/* ── KOP LEMBAGA ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6 text-white text-center print:bg-slate-900">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold opacity-80 mb-1">Laporan Hasil Belajar</p>
        <h1 className="text-xl font-black tracking-tight">{tenantName}</h1>
        <p className="text-[11px] font-semibold opacity-70 mt-1">Program Calistung — Membaca · Menulis · Berhitung</p>
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

        {/* ── PENILAIAN MEMBACA ───────────────────────────────────────────── */}
        <div>
          <SectionHeader icon={BookOpen} title="Target Membaca" color="bg-blue-50 text-blue-700" />
          <div className="px-2">
            <PenilaianRow label="Mampu membaca gambar" level={d.membaca_gambar} />
            <PenilaianRow label="Mampu membaca bacaan kalimat" level={d.membaca_kalimat} />
            <PenilaianRow label="Membaca kalimat sederhana" level={d.kalimat_sederhana} />
            <PenilaianRow label="Membaca huruf kapital" level={d.huruf_kapital} />
            <PenilaianRow label="Intonasi membaca" level={d.intonasi_membaca} />
            <PenilaianRow label="Mengeja suku kata" level={d.mengeja_suku_kata} />
            <PenilaianRow label="Mengenal tanda baca" level={d.tanda_baca} />
          </div>
        </div>

        {/* ── PENILAIAN MENULIS ───────────────────────────────────────────── */}
        <div>
          <SectionHeader icon={PenLine} title="Target Menulis" color="bg-indigo-50 text-indigo-700" />
          <div className="px-2">
            <PenilaianRow label="Cara memegang alat tulis & jarak mata" level={d.cara_memegang_alat} />
            <PenilaianRow label="Menulis huruf besar dan kecil" level={d.huruf_besar_kecil} />
            <PenilaianRow label="Menulis kata atau kalimat sederhana" level={d.menulis_kalimat} />
          </div>
        </div>

        {/* ── PENILAIAN MENGHITUNG ────────────────────────────────────────── */}
        <div>
          <SectionHeader icon={Calculator} title="Target Menghitung" color="bg-emerald-50 text-emerald-700" />
          <div className="px-2">
            <PenilaianRow label="Mengenal bilangan puluhan–ratusan" level={d.bilangan_puluhan} />
            <PenilaianRow label="Mengenal penjumlahan dan pengurangan" level={d.penjumlahan_pengurangan} />
          </div>
        </div>

        {/* ── NARASI GURU ────────────────────────────────────────────────── */}
        {d.narasi_guru && (
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare size={13} className="text-blue-600" />
              <span className="text-[10px] uppercase tracking-widest font-black text-blue-700">Catatan Guru</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{d.narasi_guru}&rdquo;</p>
          </div>
        )}

        {d.rekomendasi && (
          <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={13} className="text-amber-600" />
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
