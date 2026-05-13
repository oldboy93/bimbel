"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Book, Home, LogOut, Loader2, User, Users, Calendar, Award, BookOpen, Settings, Wallet } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string>("murid");
  const [fullName, setFullName] = useState<string>("Memuat...");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setRole(profile.role || "murid");
        setFullName(profile.full_name || "Pengguna");
      }
      setIsLoading(false);
    };

    fetchUserRole();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = {
    owner: [
      { name: "Beranda", href: "/owner", icon: Home },
      { name: "Manajemen Murid", href: "/owner/murid", icon: User },
      { name: "Manajemen Guru", href: "/owner/guru", icon: Users },
      { name: "Manajemen Kelas", href: "/owner/kelas", icon: BookOpen },
      { name: "Keuangan", href: "/owner/keuangan", icon: Wallet },
      { name: "Pengaturan", href: "/owner/pengaturan", icon: Settings },
    ],
    guru: [
      { name: "Beranda",        href: "/guru",        icon: Home        },
      { name: "Daftar Murid",   href: "/guru/murid",  icon: Users       },
      { name: "Materi Belajar", href: "/guru/materi", icon: BookOpen    },
      { name: "Absensi",        href: "/guru/absen",  icon: Calendar    },
    ],
    murid: [
      { name: "Beranda",     href: "/murid",        icon: Home   },
      { name: "Kelas Saya",  href: "/murid/kelas",  icon: Book   },
      { name: "Raport",      href: "/murid/raport", icon: Award  },
    ],
  };

  const activeMenus = menuItems[role as keyof typeof menuItems] || menuItems.murid;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/60">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-700 border-r border-slate-100">
        <div className="p-6">
          <h2 className="text-2xl font-black text-blue-600 tracking-tight">Bimbel Kita</h2>
          <div className="mt-4 bg-blue-50/40 p-3 rounded-2xl border border-blue-100/30">
            <p className="text-sm font-extrabold truncate text-slate-800">{fullName}</p>
            <p className="text-[10px] text-blue-600 uppercase tracking-wider font-extrabold mt-0.5">{role}</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-4">
          {activeMenus.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 transition-colors"} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={20} />
            <span className="font-semibold text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 relative overflow-y-auto max-h-screen">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50 shadow-lg">
        {activeMenus.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center py-1 ${isActive ? "text-blue-600" : "text-slate-400"}`}
            >
              <Icon size={22} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center py-1 text-slate-400 hover:text-red-500 transition"
        >
          <LogOut size={22} />
          <span className="text-[10px] mt-1 font-medium">Keluar</span>
        </button>
      </nav>
    </div>
  );
}
