-- Migration Name: init_bimbel_schema
-- Description: Tabel pondasi untuk Bimbel Calistung & Tahfidz

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  address text,
  phone text,
  subscription_plan text DEFAULT 'basic',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text CHECK (role IN ('murid', 'guru', 'owner')),
  avatar_url text,
  phone text,
  address text,
  date_of_birth date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('tahfidz', 'calistung', 'umum')),
  description text,
  price integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  parent_pin text,
  enrolled_at timestamptz DEFAULT now(),
  status text CHECK (status IN ('active', 'inactive', 'graduated'))
);

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  activity text NOT NULL,
  material_notes text,
  time_start time,
  time_end time,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text CHECK (status IN ('H', 'I', 'A')),
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT attendances_enrollment_date_unique UNIQUE (enrollment_id, date)
);

CREATE TABLE IF NOT EXISTS hafalan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number int NOT NULL,
  surah_name text NOT NULL,
  total_ayat int NOT NULL,
  ayat_reached int NOT NULL DEFAULT 0,
  session_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tajwid_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  makhraj_level text CHECK (makhraj_level IN ('mulai', 'sedang', 'lancar')),
  makhraj_notes text,
  kelancaran_level text CHECK (kelancaran_level IN ('mulai', 'sedang', 'lancar')),
  kelancaran_notes text,
  tajwid_level text CHECK (tajwid_level IN ('mulai', 'sedang', 'lancar')),
  tajwid_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teacher_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  note_date date NOT NULL,
  content text NOT NULL,
  is_visible_to_wali boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text,
  type text CHECK (type IN ('pdf', 'video', 'link', 'text')),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  guru_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  period text NOT NULL,
  scores jsonb,
  summary text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Mengaktifkan Row Level Security (RLS) di semua tabel
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tajwid_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
