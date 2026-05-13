"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Ambil profile untuk tahu role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "owner") {
      router.push("/owner");
    } else if (profile?.role === "guru") {
      router.push("/guru");
    } else {
      router.push("/murid");
    }
    
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="text-slate-500 text-sm mt-2">Silakan login untuk mengakses dashboard bimbel</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          
          <Button 
            disabled={isLoading}
            type="submit" 
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-6 text-base font-medium shadow-md shadow-blue-500/20" 
            size="lg"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
