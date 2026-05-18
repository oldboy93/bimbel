// types/index.ts
// TypeScript types & interfaces untuk semua modul LMS Bimbel

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  subscription_plan: 'basic' | 'pro' | 'enterprise';
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: 'murid' | 'guru' | 'owner';
  avatar_url?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  is_active: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  tenant_id: string;
  name: string;
  type: 'tahfidz' | 'calistung' | 'umum';
  description?: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  tenant_id: string;
  student_id: string;
  class_id: string;
  parent_pin?: string;
  enrolled_at: string;
  status: 'active' | 'inactive' | 'graduated';
  // Joined relations (optional)
  profiles?: Profile;
  classes?: Class;
}

export interface Schedule {
  id: string;
  enrollment_id: string;
  day_of_week: number; // 0=Minggu .. 6=Sabtu
  activity: string;
  material_notes?: string;
  time_start?: string;
  time_end?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  guru_id: string;
  date: string;
  status: 'H' | 'I' | 'A';
  notes?: string;
  created_at: string;
}

export interface HafalanProgress {
  id: string;
  enrollment_id: string;
  guru_id: string;
  surah_number: number;
  surah_name: string;
  total_ayat: number;
  ayat_reached: number;
  session_date: string;
  notes?: string;
  created_at: string;
}

export interface TajwidAssessment {
  id: string;
  enrollment_id: string;
  guru_id: string;
  session_date: string;
  makhraj_level: 'mulai' | 'sedang' | 'lancar';
  makhraj_notes?: string;
  kelancaran_level: 'mulai' | 'sedang' | 'lancar';
  kelancaran_notes?: string;
  tajwid_level: 'mulai' | 'sedang' | 'lancar';
  tajwid_notes?: string;
  created_at: string;
}

export interface TeacherNote {
  id: string;
  enrollment_id: string;
  guru_id: string;
  note_date: string;
  content: string;
  is_visible_to_wali: boolean;
  created_at: string;
}

export interface Material {
  id: string;
  tenant_id: string;
  guru_id: string;
  class_id?: string;
  title: string;
  description?: string;
  file_url?: string;
  type: 'pdf' | 'video' | 'link' | 'text' | 'artikel';
  is_published: boolean;
  metadata?: any;
  created_at: string;
}

export interface ReportCard {
  id: string;
  enrollment_id: string;
  guru_id: string;
  period: string;
  scores?: Record<string, number>;
  summary?: string;
  published_at?: string;
  created_at: string;
}

// ── API Response Wrappers ──────────────────────────
export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

// ── Enrollment dengan join ─────────────────────────
export interface EnrollmentWithDetails extends Enrollment {
  profiles: Profile;
  classes: Class;
  schedules?: Schedule[];
}
