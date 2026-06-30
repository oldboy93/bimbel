"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface ProvisionInput {
  email: string;
  password?: string;
  fullName: string;
  role: "guru" | "murid";
  phone?: string;
  address?: string;
}

// Helper to generate a random password if not provided
const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

export async function provisionUser(input: ProvisionInput) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !user) throw new Error("Unauthorized");

    // Pastikan caller adalah owner
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      throw new Error("Hanya owner yang dapat melakukan aksi ini.");
    }

    const adminSupabase = createAdminClient();
    // Gunakan tenant_id milik owner, BUKAN dari process.env (untuk mencegah cross-tenant)
    const tenantId = callerProfile?.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || "11111111-1111-1111-1111-111111111111";
    
    // Jangan gunakan hardcoded default password yang lemah!
    const defaultPassword = input.password || generateRandomPassword();

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

    // Set app_metadata (tamper-proof, hanya bisa diubah oleh server/admin)
    // Ini yang digunakan oleh RLS dan middleware untuk otorisasi
    await adminSupabase.auth.admin.updateUserById(userId, {
      app_metadata: { role: input.role, tenant_id: tenantId }
    });

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
    const supabase = createClient();
    const { data: { user }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      throw new Error("Hanya owner yang dapat melakukan aksi ini.");
    }

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

interface UpdateUserInput {
  userId: string;
  email?: string;
  password?: string;
  fullName: string;
  phone?: string;
  address?: string;
  role: "guru" | "murid";
}

export async function updateUser(input: UpdateUserInput) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      throw new Error("Hanya owner yang dapat melakukan aksi ini.");
    }

    const adminSupabase = createAdminClient();

    const updateData: any = {};
    if (input.email) {
      updateData.email = input.email;
    }
    if (input.password) {
      updateData.password = input.password;
    }
    if (input.fullName) {
      updateData.user_metadata = {
        full_name: input.fullName,
        role: input.role,
      };
    }

    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await adminSupabase.auth.admin.updateUserById(
        input.userId,
        updateData
      );
      if (authError) {
        return { success: false, error: authError.message };
      }
    }

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.phone || "",
        address: input.address || "",
      })
      .eq("id", input.userId);

    if (profileError) {
      return { success: false, error: `Gagal memperbarui profil: ${profileError.message}` };
    }

    revalidatePath(`/owner/${input.role}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan internal." };
  }
}

export async function getStudentEmails() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "owner") {
      throw new Error("Hanya owner yang dapat melakukan aksi ini.");
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      perPage: 1000
    });
    
    if (error) {
      return { success: false, error: error.message };
    }

    const emailMap: Record<string, string> = {};
    if (data && data.users) {
      data.users.forEach((u) => {
        emailMap[u.id] = u.email || "";
      });
    }

    return { success: true, emailMap };
  } catch (err: any) {
    return { success: false, error: err.message || "Terjadi kesalahan internal." };
  }
}
