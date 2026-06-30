import { NextResponse } from "next/server";
import { kirimNotifikasiWA } from "@/lib/gowa";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Validasi sesi — hanya user yang sudah login yang boleh mengirim notifikasi WA
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      );
    }

    // Validasi format nomor telepon (hanya angka, 10–15 digit)
    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json(
        { success: false, error: "Format nomor telepon tidak valid" },
        { status: 400 }
      );
    }

    // Batasi panjang pesan untuk mencegah abuse
    if (String(message).length > 2000) {
      return NextResponse.json(
        { success: false, error: "Pesan terlalu panjang (maks 2000 karakter)" },
        { status: 400 }
      );
    }

    const res = await kirimNotifikasiWA(cleanPhone, message);

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal mengirim notifikasi" },
      { status: 500 }
    );
  }
}
