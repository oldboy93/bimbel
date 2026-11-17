// services/leaderboardService.ts
// Query murid terajin per kelas berdasarkan kehadiran utama (30 hari terakhir) + info level

import { createClient } from "@/lib/supabase/client";
import { getStudentLevelInfo } from "@/lib/revisionHelpers";

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  total_setoran: number;
  hadir_count: number;
  total_sesi: number;
  attendance_rate: number;
  score: number; // Berbasis kehadiran utama (1 hadir = 10 poin)
  student_level: string; // Level capaian murid
}

export async function getClassLeaderboard(
  studentId: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const db = createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceDate = thirtyDaysAgo.toISOString().split("T")[0];

  try {
    // 1. Cari kelas yang diikuti murid ini
    const { data: myEnrollments } = await db
      .from("enrollments")
      .select("class_id, classes(id, name)")
      .eq("student_id", studentId)
      .eq("status", "active");

    if (!myEnrollments || myEnrollments.length === 0) return [];

    const classIds = myEnrollments.map((e) => e.class_id);

    // 2. Ambil semua murid aktif di kelas yang sama
    const { data: classEnrollments } = await db
      .from("enrollments")
      .select("id, student_id, class_id, classes(name), profiles(full_name)")
      .in("class_id", classIds)
      .eq("status", "active");

    if (!classEnrollments || classEnrollments.length === 0) return [];

    // 3. Hitung kehadiran dan setoran hafalan per enrollment dalam 30 hari
    const enrollmentIds = classEnrollments.map((e) => e.id);

    const [hafalanRes, murajaahRes, iqroRes, attendanceRes, allHafalanRes] = await Promise.all([
      db
        .from("hafalan_progress")
        .select("enrollment_id, session_date")
        .in("enrollment_id", enrollmentIds)
        .gte("session_date", sinceDate),
      db
        .from("murajaah_sessions")
        .select("enrollment_id, session_date")
        .in("enrollment_id", enrollmentIds)
        .gte("session_date", sinceDate),
      db
        .from("iqro_progress")
        .select("enrollment_id, session_date")
        .in("enrollment_id", enrollmentIds)
        .gte("session_date", sinceDate),
      db
        .from("attendances")
        .select("enrollment_id, status")
        .in("enrollment_id", enrollmentIds)
        .gte("date", sinceDate),
      // Ambil seluruh hafalan untuk menentukan level masing-masing murid
      db
        .from("hafalan_progress")
        .select("enrollment_id, surah_number, surah_name, ayat_reached, total_ayat, status")
        .in("enrollment_id", enrollmentIds),
    ]);

    // 4. Aggregate per enrollment
    const setoranMap: Record<string, number> = {};
    const hasilMap: Record<string, { hadir: number; total: number }> = {};
    const levelMap: Record<string, number> = {};

    ((hafalanRes.data ?? []) as Array<{ enrollment_id: string }>).forEach((h) => {
      setoranMap[h.enrollment_id] = (setoranMap[h.enrollment_id] ?? 0) + 1;
    });
    ((murajaahRes.data ?? []) as Array<{ enrollment_id: string }>).forEach((m) => {
      setoranMap[m.enrollment_id] = (setoranMap[m.enrollment_id] ?? 0) + 1;
    });
    ((iqroRes.data ?? []) as Array<{ enrollment_id: string }>).forEach((iq) => {
      setoranMap[iq.enrollment_id] = (setoranMap[iq.enrollment_id] ?? 0) + 1;
    });

    ((attendanceRes.data ?? []) as Array<{ enrollment_id: string; status: string }>).forEach((a) => {
      if (!hasilMap[a.enrollment_id]) hasilMap[a.enrollment_id] = { hadir: 0, total: 0 };
      hasilMap[a.enrollment_id].total += 1;
      if (a.status?.toUpperCase() === "H") hasilMap[a.enrollment_id].hadir += 1;
    });

    // Hitung tuntas juz per murid untuk penentuan level
    const juzDonePerEnr: Record<string, Set<string>> = {};
    ((allHafalanRes.data ?? []) as Array<{
      enrollment_id: string;
      surah_number: number;
      surah_name: string;
      ayat_reached: number;
      total_ayat: number;
      status?: string;
    }>).forEach((h) => {
      const isLulus = (h.status ?? "lulus") === "lulus";
      const isJuz = h.surah_number === 0 || h.surah_name.startsWith("Juz ");
      const total = h.total_ayat || 20;
      if (isLulus && isJuz && h.ayat_reached >= total) {
        if (!juzDonePerEnr[h.enrollment_id]) juzDonePerEnr[h.enrollment_id] = new Set();
        juzDonePerEnr[h.enrollment_id].add(h.surah_name);
      }
    });

    Object.keys(juzDonePerEnr).forEach((eId) => {
      levelMap[eId] = juzDonePerEnr[eId].size;
    });

    // 5. Build leaderboard entries (ENH-3: Kehadiran adalah dasar poin utama)
    const entries: LeaderboardEntry[] = classEnrollments.map((enr) => {
      const setoran = setoranMap[enr.id] ?? 0;
      const att = hasilMap[enr.id] ?? { hadir: 0, total: 0 };
      const attendanceRate = att.total > 0 ? (att.hadir / att.total) * 100 : 0;

      // ENH-3: Poin berbasis kehadiran utama (1 sesi hadir = 10 poin)
      // Jika hadir sama, tie-breaker menggunakan persentase kehadiran lalu jumlah setoran
      const score = att.hadir * 10;

      const completedJuz = levelMap[enr.id] ?? 0;
      const levelInfo = getStudentLevelInfo(completedJuz);

      const classInfo = Array.isArray(enr.classes) ? enr.classes[0] : enr.classes;
      const profileInfo = Array.isArray(enr.profiles) ? enr.profiles[0] : enr.profiles;

      return {
        student_id: enr.student_id,
        student_name: (profileInfo as { full_name: string } | null)?.full_name ?? "Anonim",
        class_id: enr.class_id,
        class_name: (classInfo as { name: string } | null)?.name ?? "-",
        total_setoran: setoran,
        hadir_count: att.hadir,
        total_sesi: att.total,
        attendance_rate: Math.round(attendanceRate),
        score,
        student_level: levelInfo.label,
      };
    });

    // 6. Sort by score (kehadiran) descending, lalu attendance_rate, lalu total_setoran
    return entries
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.attendance_rate !== a.attendance_rate) return b.attendance_rate - a.attendance_rate;
        return b.total_setoran - a.total_setoran;
      })
      .slice(0, limit);
  } catch (err) {
    console.error("[leaderboardService] Error:", err);
    return [];
  }
}
