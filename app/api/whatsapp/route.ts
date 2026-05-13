import { NextResponse } from "next/server";
import { kirimNotifikasiWA } from "@/lib/gowa";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      );
    }

    const res = await kirimNotifikasiWA(phone, message);

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
