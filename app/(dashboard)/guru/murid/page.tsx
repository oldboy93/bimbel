"use client";

import { useState, useEffect, Suspense } from "react";
import { tampilSemuaEnrollment } from "@/services/studentService";
import type { EnrollmentWithDetails } from "@/types";
import { Loader2, GraduationCap, Phone, MapPin, ChevronRight, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { PROGRAM_TYPES } from "@/lib/helpers";
import { useSearchParams } from "next/navigation";

function StudentListContent() {
  const searchParams = useSearchParams();
  const initClassId = searchParams.get("class_id") || "all";
  
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [filtered, setFiltered] = useState<EnrollmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClassId, setFilterClassId] = useState(initClassId);
  const [collapsedLetters, setCollapsedLetters] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved class selection on mount ONLY if no class_id query parameter is present
  useEffect(() => {
    const queryClassId = searchParams.get("class_id");
    if (!queryClassId) {
      const saved = localStorage.getItem("guru_murid_selected_class");
      if (saved) {
        setFilterClassId(saved);
      }
    }
    setIsInitialized(true);
  }, [searchParams]);

  // Save selection whenever it changes (only after initialization)
  useEffect(() => {
    if (isInitialized && filterClassId) {
      localStorage.setItem("guru_murid_selected_class", filterClassId);
    }
  }, [filterClassId, isInitialized]);

  useEffect(() => {
    tampilSemuaEnrollment().then((data) => {
      setEnrollments(data);
      setFiltered(data);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      enrollments.filter(
        (e) => {
          const matchSearch = e.profiles?.full_name?.toLowerCase().includes(q) || e.classes?.name?.toLowerCase().includes(q);
          const matchClass = filterClassId === "all" || e.class_id === filterClassId;
          return matchSearch && matchClass;
        }
      )
    );
  }, [search, filterClassId, enrollments]);

  const toggleLetterCollapse = (letter: string) => {
    setCollapsedLetters(prev => ({ ...prev, [letter]: !prev[letter] }));
  };

  const uniqueClasses = Array.from(new Map(enrollments.map(e => [e.class_id, { id: e.class_id, name: e.classes?.name }])).values()).filter(c => c.name);
  
  const groupedEnrollments = filtered.reduce((acc, enr) => {
    const name = enr.profiles?.full_name || "?";
    const letter = name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(enr);
    return acc;
  }, {} as Record<string, EnrollmentWithDetails[]>);

  const sortedLetters = Object.keys(groupedEnrollments).sort();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <GraduationCap className="text-blue-600 h-8 w-8" />
          Daftar Murid
        </h1>
        <p className="text-slate-500 mt-1">
          Klik nama murid untuk melihat detail, hafalan, dan riwayat kehadiran.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama murid atau kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>
        <div className="sm:w-64">
          <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
            <option value="all">Semua Kelas</option>
            {uniqueClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {sortedLetters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <GraduationCap className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-slate-500">
            {search ? "Tidak ada murid yang cocok." : "Belum ada murid yang terdaftar di kelas."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedLetters.map((letter) => (
            <div key={letter} className="space-y-3">
              <h2 
                onClick={() => toggleLetterCollapse(letter)}
                className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center text-sm group-hover:bg-blue-200 transition">{letter}</span>
                  <span className="text-sm font-normal text-slate-400 group-hover:text-slate-600 transition">
                    ({groupedEnrollments[letter].length} murid)
                  </span>
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${collapsedLetters[letter] ? 'rotate-180' : ''}`} />
              </h2>
              {!collapsedLetters[letter] && groupedEnrollments[letter].map((enr) => {
                const prog = PROGRAM_TYPES[(enr.classes?.type ?? "umum") as keyof typeof PROGRAM_TYPES];
                return (
                  <Link
                    key={enr.id}
                    href={`/guru/murid/${enr.student_id}`}
                    className="block bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
                          {enr.profiles?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                            {enr.profiles?.full_name ?? "Tanpa Nama"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                              {prog?.icon} {enr.classes?.name ?? "-"}
                            </span>
                            {enr.profiles?.phone && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Phone size={11} />
                                {enr.profiles.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition shrink-0" size={20} />
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentListPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>}>
      <StudentListContent />
    </Suspense>
  );
}
