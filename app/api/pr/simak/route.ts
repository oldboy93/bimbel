import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // 1. Verifikasi sesi user yang login
    const supabaseUser = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, id, rating, status, notes } = body;

    if (!type || !id || !rating || !status) {
      return NextResponse.json(
        { success: false, error: "Data penilaian tidak lengkap." },
        { status: 400 }
      );
    }

    if (!["hafalan", "murajaah"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Tipe tugas PR tidak valid." },
        { status: 400 }
      );
    }

    const numRating = parseInt(String(rating), 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating harus bernilai 1 s.d. 5 bintang." },
        { status: 400 }
      );
    }

    if (!["lancar", "cukup", "perlu_bimbingan"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status simakan tidak valid." },
        { status: 400 }
      );
    }

    // 2. Gunakan Service Role Supabase Client untuk bypass RLS secara aman di server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminDb = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const targetTable = type === "hafalan" ? "hafalan_progress" : "murajaah_sessions";

    // 3. Pastikan record yang ingin diupdate memang ada
    const { data: record, error: findError } = await adminDb
      .from(targetTable)
      .select("id, enrollment_id")
      .eq("id", id)
      .maybeSingle();

    if (findError || !record) {
      return NextResponse.json(
        { success: false, error: "Sesi PR tidak ditemukan." },
        { status: 404 }
      );
    }

    // 4. Update kolom feedback orang tua
    const updatePayload = {
      parent_rating: numRating,
      parent_status: status,
      parent_notes: typeof notes === "string" ? notes.trim() : null,
      parent_simak_at: new Date().toISOString(),
    };

    const { error: updateError } = await adminDb
      .from(targetTable)
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("[api/pr/simak] Update error:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message || "Gagal mengupdate penilaian." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Penilaian orang tua berhasil disimpan.",
      updated_at: updatePayload.parent_simak_at,
    });
  } catch (err: any) {
    console.error("[api/pr/simak] Catch error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
