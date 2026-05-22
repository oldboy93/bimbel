"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Sparkles, BookOpen, GraduationCap, Users } from "lucide-react";

const SAHIH_HADITHS = [
  { text: "Barang siapa yang menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan ke surga.", reference: "HR. Muslim" },
  { text: "Sebaik-baik kalian adalah orang yang mempelajari Al-Qur'an dan mengajarkannya.", reference: "HR. Bukhari" },
  { text: "Menuntut ilmu itu wajib atas setiap Muslim.", reference: "HR. Ibnu Majah (Shahih)" },
  { text: "Jika seseorang meninggal dunia, maka terputuslah amalnya kecuali tiga perkara: sedekah jariyah, ilmu yang bermanfaat, atau anak shalih yang mendoakannya.", reference: "HR. Muslim" },
  { text: "Orang yang menunjukkan kepada kebaikan, maka ia memperoleh pahala seperti orang yang melakukannya.", reference: "HR. Muslim" }
];

const APP_FEATURES = [
  { icon: GraduationCap, title: "Kurikulum Terintegrasi", desc: "Dari Calistung dasar yang fokus per target penilaian hingga program Tajwid Al-Quran interaktif." },
  { icon: Users, title: "Laporan Orang Tua", desc: "Akses PIN khusus wali murid untuk memantau nilai, kehadiran, raport, dan feedback dari guru secara aman." },
  { icon: BookOpen, title: "Pertemuan Per Murid", desc: "Sistem penjadwalan sesi belajar tatap muka personal yang fleksibel untuk efektivitas maksimal." }
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingPopup, setShowLoadingPopup] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedHadith, setSelectedHadith] = useState<typeof SAHIH_HADITHS[0] | null>(null);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Pick a single random Sahih Hadith for this login attempt
  useEffect(() => {
    if (showLoadingPopup && !selectedHadith) {
      const idx = Math.floor(Math.random() * SAHIH_HADITHS.length);
      setSelectedHadith(SAHIH_HADITHS[idx]);
    }
  }, [showLoadingPopup, selectedHadith]);

  // Loading progress bar (7 seconds total duration)
  useEffect(() => {
    if (!showLoadingPopup || !pendingRedirectUrl) return;

    const totalDuration = 7000; // 7 seconds
    const intervalTime = 100;
    const increment = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Execute redirect
          router.push(pendingRedirectUrl);
          router.refresh();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [showLoadingPopup, pendingRedirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password yang Anda masukkan salah. Silakan coba kembali.");
      setIsLoading(false);
      return;
    }

    // Load profile to determine dashboard redirection & tenant info
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", data.user.id)
      .single();

    let resolvedTenantName = "Sistem Akademik";
    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name")
        .eq("id", profile.tenant_id)
        .single();
      if (tenant?.name) {
        resolvedTenantName = tenant.name;
      }
    }
    setTenantName(resolvedTenantName);

    let targetUrl = "/murid";
    if (profile?.role === "owner") {
      targetUrl = "/owner";
    } else if (profile?.role === "guru") {
      targetUrl = "/guru";
    }

    setPendingRedirectUrl(targetUrl);
    setShowLoadingPopup(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-hidden relative">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex w-full max-w-7xl mx-auto my-auto p-4 md:p-8 shrink-0 min-h-[90vh] items-stretch justify-center gap-6">
        
        {/* Left Side: Professional Information (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-1 flex-col justify-between bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-slate-200/50 rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-900/[0.015] bg-[size:30px_30px]" />
          
          {/* Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 border border-blue-200/40 rounded-xl">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-none tracking-tight">Sistem Akademik</h2>
              <span className="text-xs font-bold text-slate-500">Portal Bersama Mitra Bimbel</span>
            </div>
          </div>

          {/* Center: Features Showcase */}
          <div className="relative z-10 space-y-8 my-auto">
            <h1 className="text-3xl font-black text-slate-900 leading-snug">
              Platform Belajar & Monitoring <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Santri Modern Terbaik.
              </span>
            </h1>

            <div className="space-y-5">
              {APP_FEATURES.map((f, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200/80 shadow-sm transition duration-300">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{f.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Check */}
          <div className="relative z-10 border-t border-slate-200/80 pt-6">
            <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
              <ShieldCheck className="text-emerald-600 shrink-0" size={16} /> Terenkripsi & Terintegrasi dengan Sistem Cloud Akademik
            </p>
          </div>
        </div>

        {/* Right Side: Clean Light Mode Form Card */}
        <div className="w-full max-w-lg flex flex-col justify-center bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-lg relative">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles size={16} />
              </div>
              <span className="font-black text-sm text-slate-800 tracking-wide">Portal Akademik Bimbel</span>
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang di Bimbel</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-semibold">Silakan masuk Email Akun Bimbel Anda..</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-center leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Akademik</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 rounded-xl text-sm font-semibold outline-none transition placeholder-slate-400"
                placeholder="nama@email.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kata Sandi</label>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 rounded-xl text-sm font-semibold outline-none transition placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>

            <Button 
              disabled={isLoading}
              type="submit" 
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-sm font-black text-white shadow-lg shadow-blue-600/10 transition-all active:scale-[0.98] duration-150 disabled:opacity-50" 
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-white" /> Memverifikasi...
                </span>
              ) : "Masuk ke Dashboard"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 font-bold mt-8">
            Butuh bantuan akses? Silakan hubungi Administrator Bimbel.
          </p>
        </div>

      </div>

      {/* ── STUNNING EDUCATIONAL LOADING OVERLAY (LIGHT MODE) ── */}
      {showLoadingPopup && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 md:p-10 shadow-2xl relative text-center space-y-8 overflow-hidden">
            <div className="absolute inset-0 bg-grid-slate-900/[0.01] bg-[size:20px_20px] pointer-events-none" />
            
            {/* Spinning & Glowing Loader */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-indigo-600 animate-spin" />
              <div className="absolute inset-2 bg-blue-50/50 rounded-full flex items-center justify-center">
                <Sparkles className="text-blue-600 animate-pulse" size={28} />
              </div>
            </div>

            {/* Countdown / Loading Label */}
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-800 tracking-wide uppercase">Mempersiapkan Ruang Belajar Anda</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Masuk ke <span className="font-extrabold text-blue-600">{tenantName || "Sistem Bimbel"}</span>...
              </p>
            </div>

            {/* Static Selected Sahih Hadith (Picked randomly for this session) */}
            {selectedHadith && (
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl min-h-[110px] flex flex-col justify-center transition-all duration-500 relative">
                <span className="text-[40px] text-blue-500/10 font-serif absolute left-3 top-0">&ldquo;</span>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed italic z-10">
                  {selectedHadith.text}
                </p>
                <p className="text-xs font-black text-blue-600 mt-2.5 z-10">— Hadits Shahih ({selectedHadith.reference})</p>
              </div>
            )}

            {/* Premium Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-100 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Memulai Sesi...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
