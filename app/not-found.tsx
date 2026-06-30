"use client";

import Link from "next/link";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center animate-bounce text-blue-600">
            <BookOpen size={40} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-blue-600 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-900">Halaman Tidak Ditemukan</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Afwan, halaman yang Anda cari tidak ada atau Anda belum login/tidak memiliki akses ke halaman ini.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/10 transition-all"
          >
            <Home size={16} />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
