"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

interface ProvisionInput {
  email: string;
  password?: string;
  fullName: string;
  role: "guru" | "murid";
  phone?: string;
  address?: string;
}

export async function provisionUser(input: ProvisionInput) {
  try {
    const adminSupabase = createAdminClient();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || "11111111-1111-1111-1111-111111111111";
    const defaultPassword = input.password || "Bimbel123!";

    // 1. Create user in Supabase Auth using Admin API
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: input.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        role: input.role,
        full_name: input.fullName,
      }
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { success: false, error: "Gagal membuat identitas auth." };
    }

    // 2. Insert corresponding profile row
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: userId,
        tenant_id: tenantId,
        full_name: input.fullName,
        role: input.role,
        phone: input.phone || "",
        address: input.address || "",
        is_active: true,
      });

    if (profileError) {
      // Rollback auth user creation if profile insertion fails to keep data atomic
      await adminSupabase.auth.admin.deleteUser(userId);
      return { success: false, error: `Gagal membuat profil: ${profileError.message}` };
    }

    revalidatePath(`/owner/${input.role}`);
    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan internal." };
  }
}

export async function deleteUser(userId: string, role: "guru" | "murid") {
  try {
    const adminSupabase = createAdminClient();
    
    // Deleting the user from Auth will automatically delete their profile due to ON DELETE CASCADE
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);
    
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/owner/${role}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan internal." };
  }
}
