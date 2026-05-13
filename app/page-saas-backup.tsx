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
            <a href="#fitur" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Fitur Unggulan</a>
            <a href="#program" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Program Belajar</a>
            <a href="#keunggulan" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition">Mengapa Kami</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Masuk Dashboard
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100/50 rounded-full text-blue-600 font-extrabold text-xs tracking-wider uppercase animate-bounce">
            <Sparkles size={14} /> Platform Bimbel Tahfidz & Calistung #1
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Membentuk Generasi <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cerdas</span> & <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Qur'ani</span>
            </h1>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
              Sistem manajemen pembelajaran modern yang mengintegrasikan pengajaran membaca, menulis, berhitung, serta pelaporan progres hafalan Al-Qur'an secara real-time langsung ke genggaman wali murid.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Coba Demo Sekarang <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#fitur" 
              className="px-8 py-4 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 font-bold text-sm rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              Pelajari Fitur
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200/50 max-w-lg">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600">100%</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Terpantau Nyata</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">6 Digit</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">PIN Keamanan Wali</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">Real-Time</p>
              <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Laporan Kemajuan</p>
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
                  <p className="text-[10px] text-slate-400 font-medium">Kelas Tahfidz A</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Target Tahfidz</span>
                  <span className="text-emerald-600">100% Selesai</span>
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
                <h4 className="font-black text-slate-900 text-sm">Akses Khusus Wali</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Masukkan 6 digit PIN Wali untuk membuka catatan ustadz.</p>
              </div>
              <div className="flex justify-between gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <div key={num} className="w-7 h-9 rounded-lg border-2 border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs bg-slate-50/50">
                    {num <= 4 ? "•" : ""}
                  </div>
                ))}
              </div>
              <button className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl text-[11px] shadow-md shadow-blue-500/10">
                Buka Catatan Guru
              </button>
            </div>

            {/* Attendance Stat Card (Floating Bottom Right) */}
            <div className="absolute bottom-4 right-[-16px] sm:right-[-24px] w-48 bg-white/95 backdrop-blur-lg p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-2 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kehadiran</span>
                <span className="text-xs font-black text-blue-600">98.2%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                <Activity size={12} className="text-blue-500" /> Hadir Teratur
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="fitur" className="bg-white border-y border-slate-200/40 py-24 px-6 lg:px-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-extrabold text-blue-600 tracking-widest uppercase">Fitur Berkelas</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Kelebihan Platform Sistem Kami</h3>
            <p className="text-sm sm:text-base text-slate-500 font-medium">Satu sistem terintegrasi yang dirancang khusus untuk memajukan pengelolaan bimbingan belajar tahfidz dan anak usia dini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Fitur 1 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <BookOpen size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Tahfidz & Calistung</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Pemantauan progres hafalan surah serta kecakapan membaca, menulis, dan berhitung yang terstruktur.</p>
              </div>
            </div>

            {/* Fitur 2 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <MessageSquare size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">WhatsApp Notifikasi</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Kirim laporan setoran hafalan dan absensi langsung ke WhatsApp orang tua murid secara instan.</p>
              </div>
            </div>

            {/* Fitur 3 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <FileText size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Raport Digital PDF</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Satu klik saja untuk mencetak atau mengunduh lembar kemajuan belajar berkala yang siap diberikan.</p>
              </div>
            </div>

            {/* Fitur 4 */}
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition duration-300">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">Proteksi PIN Khusus</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Data evaluasi murid terlindungi dengan sistem keamanan akses berbasis PIN wali murid yang modern.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Program Belajar Section */}
      <section id="program" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xs font-extrabold text-blue-600 tracking-widest uppercase">Program Pembelajaran</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">Kurikulum Unggulan Terbaik untuk Masa Depan</h3>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">
              Kami menyelaraskan metode pembelajaran yang menyenangkan bagi anak usia dini dengan dasar-dasar ilmu agama yang kuat dan kokoh sejak usia belia.
            </p>
            <div className="space-y-4">
              {[
                "Kelas Baca Tulis Al-Qur'an (BTQ) & Tahfidz",
                "Kelas Membaca & Menulis (Calistung Dasar)",
                "Penerapan Metode Iqra dan Murottal Interaktif",
                "Monitoring Kemampuan Tajwid dan Makhorijul Huruf"
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
              <h4 className="font-black text-slate-900 text-lg">Program Calistung</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Melatih anak-anak usia prasekolah untuk menguasai keterampilan membaca, menulis kalimat sederhana, dan konsep aritmatika hitung dasar dengan metode yang interaktif.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md shadow-slate-100/50 space-y-4 sm:translate-y-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">02</div>
              <h4 className="font-black text-slate-900 text-lg">Program Tahfidz Anak</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Metode hafalan yang disesuaikan untuk anak agar tidak mudah jenuh. Fokus pada ketepatan pelafalan tajwid, hafalan Juz Amma, serta pembiasaan adab-adab Islami.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-6 lg:px-16 max-w-7xl mx-auto rounded-[3rem] text-center text-white relative overflow-hidden shadow-2xl mb-24">
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
          <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug">Mari Bergabung dan Cetak Generasi Gemilang</h3>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-medium">
            Lacak kemudahan evaluasi proses KBM anak-anak Anda di platform BimbelKita sekarang juga. Masuk ke halaman dashboard di bawah ini.
          </p>
          <div className="pt-2">
            <Link 
              href="/login" 
              className="inline-block px-8 py-4 bg-white text-blue-600 font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-95 transition-all duration-300"
            >
              Masuk ke Area Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200/50 py-12 px-6 lg:px-16 text-center text-slate-400 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold">&copy; {new Date().getFullYear()} BimbelKita. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6 text-xs font-bold text-slate-400">
            <a href="#fitur" className="hover:text-blue-600 transition">Fitur</a>
            <a href="#program" className="hover:text-blue-600 transition">Program</a>
            <a href="/login" className="hover:text-blue-600 transition">Area Masuk</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
