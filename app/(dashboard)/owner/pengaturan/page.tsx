"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Settings, Loader2, Save, Building, Phone, MapPin, Globe,
  Shield, AlertCircle, CheckCircle2, Crown, Sparkles
} from "lucide-react";

export default function OwnerPengaturanPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [subscription, setSubscription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Ambil profile owner untuk tenant_id
        const { data: prof } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (prof?.tenant_id) {
          const { data: ten } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", prof.tenant_id)
            .single();

          if (ten) {
            setTenant(ten);
            setName(ten.name);
            setSlug(ten.slug);
            setPhone(ten.phone || "");
            setAddress(ten.address || "");
            setSubscription(ten.subscription_plan || "basic");
          }
        }
      } catch (err) {
        console.error("Gagal memuat info tenant:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenantInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name,
          slug,
          phone,
          address,
        })
        .eq("id", tenant.id);

      if (error) throw error;

      setFeedback({ status: "success", message: "Profil lembaga Anda berhasil diperbarui! ✨" });
    } catch (err: any) {
      setFeedback({ status: "error", message: err.message || "Gagal memperbarui profil lembaga." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-slate-400 text-sm">Memuat pengaturan lembaga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ── */}
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Pengaturan Lembaga <Settings className="text-blue-600 h-6 w-6" />
        </h1>
        <p className="text-slate-500 mt-2">Atur identitas lembaga Bimbel Anda, kelola branding, serta pantau paket berlangganan SaaS aktif.</p>
      </header>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${feedback.status === "success"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-red-50 border-red-100 text-red-800"
          }`}>
          {feedback.status === "success" ? <CheckCircle2 className="shrink-0 text-emerald-500" /> : <AlertCircle className="shrink-0 text-red-500" />}
          <p className="text-sm font-semibold">{feedback.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Pengaturan */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-2">
            <Building size={18} className="text-blue-600" /> Identitas Bimbel
          </h2>

          {/* Nama Bimbel */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Nama Lembaga</label>
            <div className="relative">
              <Building size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Slug Lembaga */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Domain / Slug URL</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-500 bg-slate-50 cursor-not-allowed"
                disabled
              />
            </div>
            <p className="text-[10px] text-slate-400">Slug URL unik lembaga Anda dan tidak dapat diubah setelah didaftarkan.</p>
          </div>

          {/* Nomor HP */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Konten Telepon / HP</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Alamat Kantor / Lembaga</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Masukkan alamat lengkap lembaga..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Perubahan
          </button>
        </form>

        {/* Panel Langganan SaaS */}
        {/* <div className="md:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] text-white/5 pointer-events-none">
              <Crown size={150} />
            </div>

            <div className="flex items-center gap-2">
              <Crown className="text-amber-400" size={20} />
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">Paket SaaS Anda</span>
            </div>

            <div>
              <p className="text-3xl font-black capitalize text-amber-400">{subscription}</p>
              <p className="text-xs text-indigo-200 mt-1">Multi-tenant Premium Account</p>
            </div>

            <div className="border-t border-indigo-900 pt-4 text-xs space-y-2 text-indigo-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400" /> Multi-Tenant Isolate
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400" /> Unlimited Murid & Guru
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-400" /> Kehadiran & Hafalan Realtime
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
