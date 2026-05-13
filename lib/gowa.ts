/**
 * gowa.ts
 * Integrasi utilitas pengiriman pesan WhatsApp menggunakan go-whatsapp-web-multidevice (Aldino Kemal).
 */

// Formatter nomor telepon ke format internasional (628xxxx)
export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  return cleaned;
};

// Fungsi kirim notifikasi pesan teks via GoWA
export const kirimNotifikasiWA = async (
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  const gowaUrl = process.env.GOWA_URL || "http://localhost:3000";
  const gowaKey = process.env.GOWA_KEY; // Token auth jika dikonfigurasi

  if (!phone) {
    return { success: false, error: "Nomor telepon kosong" };
  }

  const formattedPhone = formatPhoneNumber(phone);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (gowaKey) {
      headers["Authorization"] = `Bearer ${gowaKey}`;
    }

    const response = await fetch(`${gowaUrl}/send/message`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        receiver: formattedPhone,
        message: message,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`[GoWA] Pesan berhasil terkirim ke ${formattedPhone}:`, message.slice(0, 50) + "...");
    return { success: true };
  } catch (err: any) {
    console.error(`[GoWA] Gagal mengirim pesan ke ${formattedPhone}:`, err.message || err);
    return { success: false, error: err.message || "Gagal terkoneksi ke GoWA" };
  }
};
