import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Activity,
  FileText,
  Users,
  GraduationCap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 text-slate-900 overflow-x-hidden font-sans selection:bg-blue-100 selection:text-blue-800">

      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-slate-100/80 px-6 lg:px-16 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <GraduationCap size={22} className="animate-pulse" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              BimbelKita
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#keunggulan" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Keunggulan</a>
            <a href="#program" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Program Belajar</a>
            <a href="#fasilitas" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Fasilitas Kelas</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Portal Akademik
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 pt-12 pb-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Soft Background Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl -z-10 animate-pulse duration-[10000ms]" />

        {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100/50 rounded-full text-blue-600 font-extrabold text-xs tracking-wider uppercase">
            <Sparkles size={14} /> Lembaga Pendidikan Anak Usia Dini Terpercaya
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Membentuk Akhlak <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mulia</span> & <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Cerdas Sejak Dini</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
              Bimbingan belajar khusus anak usia TK dan SD. Kami memadukan metode Calistung (Membaca, Menulis, Berhitung) dasar yang menyenangkan dengan hafalan Al-Qur'an Juz Amma terstruktur harian.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Masuk Portal Akademik <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#program"
              className="px-8 py-4 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 font-bold text-sm rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              Lihat Program Belajar
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200/50 max-w-lg">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">20+</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Siswa Aktif</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">8 Orang</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Ustadz & Ustadzah</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">100%</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Progres Terpantau</p>
            </div>
          </div>
        </div>

        {/* Hero Right Content - Interactive Visual App Card Mockups */}
        <div className="lg:col-span-6 relative mt-12 lg:mt-0 flex justify-center lg:justify-end animate-fade-in">
          <div className="relative w-full max-w-[460px] aspect-[4/3] bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-[2.5rem] border border-white/20 p-6 flex items-center justify-center">

            {/* Live Student Stat Card (Floating Left) */}
            <div className="absolute top-4 left-[-16px] sm:left-[-32px] w-52 bg-white/95 backdrop-blur-lg p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-3 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">A</div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Ali</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Kelas Tahfidz Sore</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Target Hafalan</span>
                  <span className="text-emerald-600">100% Tercapai</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Live Parent PIN Lock Screen Card (Center Main) */}
            <div className="w-64 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-300/60 p-5 space-y-5 transform rotate-1 scale-[1.03] hover:rotate-0 transition-all duration-500">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100/30">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm">Portal Wali Murid</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Masukkan 6 digit PIN Wali untuk membuka laporan harian guru.</p>
              </div>
              <div className="flex justify-between gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} className="w-7 h-9 rounded-lg border-2 border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs bg-slate-50/50">
                    {num <= 4 ? "•" : ""}
                  </div>
                ))}
              </div>
              <button className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl text-[11px] shadow-md shadow-blue-500/10">
                Verifikasi & Buka Laporan
              </button>
            </div>

            {/* Attendance Stat Card (Floating Bottom Right) */}
            <div className="absolute bottom-4 right-[-16px] sm:right-[-24px] w-48 bg-white/95 backdrop-blur-lg p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-2 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran</span>
                <span className="text-xs font-black text-blue-600">98.2%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Activity size={12} className="text-blue-500" /> Rajin Hadir
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="keunggulan" className="bg-white border-y border-slate-200/40 py-24 px-6 lg:px-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 tracking-widest uppercase">Pendidikan Unggul</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Kenapa Harus BimbelKita?</h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium">Kami mengutamakan sinergi pendidikan akhlak, kemandirian, dan kemudahan pemantauan oleh orang tua secara modern.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Keunggulan 1 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <BookOpen size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Metode Pembelajaran Interaktif</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Belajar membaca, menulis, dan berhitung (Calistung) dasar menggunakan media visual dan praktik yang asyik bagi anak.</p>
              </div>
            </div>

            {/* Keunggulan 2 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <MessageSquare size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">WhatsApp Integrasi Orang Tua</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Dapatkan info kehadiran harian dan perkembangan setoran hafalan anak langsung terkirim otomatis ke WhatsApp Ayah/Bunda.</p>
              </div>
            </div>

            {/* Keunggulan 3 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <FileText size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Laporan Raport Digital</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Wali murid dapat mengunduh raport berkala berisi rincian nilai kemajuan membaca dan kelancaran tajwid secara transparan.</p>
              </div>
            </div>

            {/* Keunggulan 4 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Perlindungan PIN Wali</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Catatan evaluasi perkembangan khusus dari Ustadz/Ustadzah terlindungi dengan aman lewat PIN wali murid masing-masing.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Program Belajar Section */}
      <section id="program" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xs font-extrabold text-blue-600 tracking-widest uppercase">Program Bimbel</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Kurikulum Terbaik bagi Tunas Bangsa</h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">
              Kami menyelaraskan kurikulum dasar membaca & berhitung dengan bimbingan rohani yang kuat sejak usia dini, dipandu penuh kasih sayang oleh pengajar berpengalaman.
            </p>
            <div className="space-y-4">
              {[
                "Kelas Membaca & Menulis (Calistung Dasar)",
                "Kelas Mengaji Iqra & Tahfidz Juz Amma",
                "Pembinaan Makhorijul Huruf & Tajwid Dasar",
                "Kelas Privat Berfokus & Kelas Kelompok Kecil"
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-700">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">01</div>
              <h4 className="font-black text-slate-900 text-lg">Bimbingan Calistung</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Siswa dibimbing melafalkan huruf, merangkai suku kata, menulis kalimat, serta memahami konsep matematika dasar dengan gembira demi kesiapan jenjang sekolah berikutnya.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 space-y-4 sm:translate-y-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">02</div>
              <h4 className="font-black text-slate-900 text-lg">Hafalan Qur'an Anak</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Setoran hafalan Juz Amma terjadwal harian. Pengajaran ditekankan pada kelancaran membaca tajwid yang sahih dan penyebaran akhlak mulia Islami sehari-hari.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fasilitas Kelas Section */}
      <section id="fasilitas" className="bg-slate-50/50 border-t border-slate-200/40 py-24 px-6 lg:px-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-extrabold text-indigo-600 tracking-widest uppercase">Fasilitas Nyaman</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Lingkungan Belajar Kondusif</h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium">Kenyamanan fisik murid sangat berpengaruh pada konsentrasi belajar mereka. Kami menyediakan fasilitas terbaik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-black text-slate-900 text-base">❄ Ruangan Ber-AC</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Seluruh ruang bimbingan sejuk dan nyaman demi konsentrasi belajar anak secara maksimal.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-black text-slate-900 text-base">📚 Buku & Iqra Lengkap</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Perpustakaan mini dan buku panduan Iqra/Tahfidz disediakan lengkap bagi setiap murid belajar harian.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-black text-slate-900 text-base">👥 Kelas Terbatas (Kecil)</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Jumlah murid per sesi dibatasi maksimal 8 siswa agar Ustadz/Ustadzah dapat membimbing secara privat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-6 lg:px-16 max-w-7xl mx-auto rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl mb-24 mt-24">
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug">Mari Antarkan Ananda ke Jenjang Prestasi Terbaik</h3>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-medium">
            Gabung bersama keluarga besar BimbelKita. Pantau kehadiran dan hafalan Qur'an buah hati Anda secara praktis lewat Portal Akademik kami.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-300"
            >
              Masuk Portal Akademik
            </Link>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200/50 py-12 px-6 lg:px-16 text-center text-slate-400 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold">&copy; {new Date().getFullYear()} BimbelKita. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6 text-xs font-bold text-slate-400">
            <a href="#keunggulan" className="hover:text-blue-600 transition">Keunggulan</a>
            <a href="#program" className="hover:text-blue-600 transition">Program</a>
            <a href="/login" className="hover:text-blue-600 transition">Area Portal</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
