/**
 * migrate_user_app_metadata.js
 * ─────────────────────────────────────────────────────────────────────
 * Script migrasi SEKALI JALAN untuk memindahkan role & tenant_id
 * dari user_metadata ke app_metadata untuk semua user yang ada.
 *
 * MENGAPA PERLU:
 *   - user_metadata bisa diubah oleh user sendiri (tidak aman)
 *   - app_metadata hanya bisa diubah oleh server/admin (aman)
 *   - Middleware dan RLS seharusnya membaca dari app_metadata
 *
 * CARA MENJALANKAN (satu kali saja sebelum/sesudah deploy):
 *   node migrate_user_app_metadata.js
 *
 * AMAN: Script ini hanya membaca user_metadata dan MENULIS ke app_metadata.
 *        Tidak menghapus user_metadata (fallback tetap berjalan selama migrasi).
 * ─────────────────────────────────────────────────────────────────────
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrasiSemuaUser() {
  console.log("🚀 Memulai migrasi user_metadata → app_metadata...\n");

  let page = 1;
  const perPage = 100;
  let totalDiproses = 0;
  let totalDiperbarui = 0;
  let totalDilewati = 0;
  let totalError = 0;

  while (true) {
    // Ambil user secara paginated
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error(`❌ Gagal mengambil daftar user halaman ${page}:`, error.message);
      break;
    }

    const users = data?.users ?? [];
    if (users.length === 0) {
      console.log(`\n✅ Tidak ada user lagi di halaman ${page}. Selesai.`);
      break;
    }

    console.log(`📋 Halaman ${page}: memproses ${users.length} user...`);

    for (const user of users) {
      totalDiproses++;
      const userId = user.id;
      const email = user.email;

      const roleFromUser = user.user_metadata?.role;
      const tenantFromUser = user.user_metadata?.tenant_id;
      const roleFromApp = user.app_metadata?.role;
      const tenantFromApp = user.app_metadata?.tenant_id;

      // Ambil tenant_id dari tabel profiles jika tidak ada di metadata
      let tenantId = tenantFromApp || tenantFromUser;
      if (!tenantId) {
        const { data: prof } = await adminClient
          .from("profiles")
          .select("tenant_id, role")
          .eq("id", userId)
          .single();
        if (prof) {
          tenantId = prof.tenant_id;
          // Juga ambil role dari profiles jika tidak ada di metadata
          if (!roleFromUser && prof.role) {
            user.user_metadata = { ...user.user_metadata, role: prof.role };
          }
        }
      }

      const roleFinal = user.user_metadata?.role || roleFromApp;

      // Lewati jika app_metadata sudah lengkap dan benar
      if (roleFromApp === roleFinal && tenantFromApp === tenantId) {
        process.stdout.write(`  ⏭️  [${email}] sudah punya app_metadata yang benar — dilewati\n`);
        totalDilewati++;
        continue;
      }

      // Lewati user tanpa role sama sekali (misalnya akun system)
      if (!roleFinal) {
        process.stdout.write(`  ⚠️  [${email}] tidak punya role di manapun — dilewati\n`);
        totalDilewati++;
        continue;
      }

      // Update app_metadata
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: {
          ...user.app_metadata, // pertahankan field lain yang sudah ada
          role: roleFinal,
          ...(tenantId ? { tenant_id: tenantId } : {}),
        },
      });

      if (updateError) {
        console.error(`  ❌ [${email}] Gagal update: ${updateError.message}`);
        totalError++;
      } else {
        process.stdout.write(`  ✅ [${email}] role="${roleFinal}" tenant_id="${tenantId || "N/A"}" → app_metadata diperbarui\n`);
        totalDiperbarui++;
      }

      // Jeda kecil agar tidak rate-limit Supabase Admin API
      await new Promise((r) => setTimeout(r, 100));
    }

    // Jika user yang dikembalikan lebih sedikit dari perPage, berarti halaman terakhir
    if (users.length < perPage) break;
    page++;
  }

  console.log("\n" + "─".repeat(60));
  console.log("📊 RINGKASAN MIGRASI:");
  console.log(`   Total diproses : ${totalDiproses} user`);
  console.log(`   Diperbarui     : ${totalDiperbarui} user ✅`);
  console.log(`   Dilewati       : ${totalDilewati} user ⏭️`);
  console.log(`   Error          : ${totalError} user ❌`);
  console.log("─".repeat(60));

  if (totalError === 0) {
    console.log("\n🎉 Migrasi selesai tanpa error!");
    console.log("   Sekarang middleware sudah membaca dari app_metadata (aman).");
    console.log("   User lama tetap berfungsi melalui fallback user_metadata.");
  } else {
    console.log("\n⚠️  Migrasi selesai dengan beberapa error. Cek log di atas.");
  }
}

migrasiSemuaUser().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
