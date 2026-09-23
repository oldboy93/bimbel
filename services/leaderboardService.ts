// services/leaderboardService.ts
// Query murid terajin per kelas berdasarkan setoran + kehadiran (30 hari terakhir)

import { createClient } from "@/lib/supabase/client";

export interface LeaderboardEntry {
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  total_setoran: number;
  attendance_rate: number;
  score: number; // 60% setoran + 40% kehadiran (normalized)
}

const MAX_SETORAN_REFERENCE = 30; // normalisasi setoran ke 100 (anggap maks 30 setoran/bulan)

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

    // 3. Hitung setoran hafalan+murajaah per enrollment dalam 30 hari
    const enrollmentIds = classEnrollments.map((e) => e.id);

    const [{ data: hafalanData }, { data: murajaahData }, { data: attendanceData }] =
      await Promise.all([
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
          .from("attendance")
          .select("enrollment_id, status")
          .in("enrollment_id", enrollmentIds)
          .gte("date", sinceDate),
      ]);

    // 4. Aggregate per enrollment
    const setoranMap: Record<string, number> = {};
    const hasilMap: Record<string, { hadir: number; total: number }> = {};

    (hafalanData ?? []).forEach((h) => {
      setoranMap[h.enrollment_id] = (setoranMap[h.enrollment_id] ?? 0) + 1;
    });
    (murajaahData ?? []).forEach((m) => {
      setoranMap[m.enrollment_id] = (setoranMap[m.enrollment_id] ?? 0) + 1;
    });
    (attendanceData ?? []).forEach((a) => {
      if (!hasilMap[a.enrollment_id]) hasilMap[a.enrollment_id] = { hadir: 0, total: 0 };
      hasilMap[a.enrollment_id].total += 1;
      if (a.status === "H") hasilMap[a.enrollment_id].hadir += 1;
    });

    // 5. Build leaderboard entries
    const entries: LeaderboardEntry[] = classEnrollments.map((enr) => {
      const setoran = setoranMap[enr.id] ?? 0;
      const att = hasilMap[enr.id] ?? { hadir: 0, total: 0 };
      const attendanceRate = att.total > 0 ? (att.hadir / att.total) * 100 : 0;

      // Normalize setoran: cap di MAX_SETORAN_REFERENCE → max skor setoran = 100
      const setoranNorm = Math.min((setoran / MAX_SETORAN_REFERENCE) * 100, 100);

      // Score = 60% setoran + 40% kehadiran
      const score = setoranNorm * 0.6 + attendanceRate * 0.4;

      const classInfo = Array.isArray(enr.classes) ? enr.classes[0] : enr.classes;
      const profileInfo = Array.isArray(enr.profiles) ? enr.profiles[0] : enr.profiles;

      return {
        student_id: enr.student_id,
        student_name: (profileInfo as { full_name: string } | null)?.full_name ?? "Anonim",
        class_id: enr.class_id,
        class_name: (classInfo as { name: string } | null)?.name ?? "-",
        total_setoran: setoran,
        attendance_rate: Math.round(attendanceRate),
        score: Math.round(score),
      };
    });

    // 6. Sort by score descending
    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (err) {
    console.error("[leaderboardService] Error:", err);
    return [];
  }
}
