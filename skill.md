# skill.md — LMS Bimbel Calistung + Tahfidz
> Panduan teknis untuk AI/Developer dalam membangun aplikasi LMS Bimbel berbasis Next.js + Supabase.
> Didesain mobile-first, modern, dengan fondasi SaaS-ready.

---

## 1. PROJECT OVERVIEW

| Item | Detail |
|---|---|
| Nama Project | LMS Bimbel Calistung + Tahfidz |
| Target User | Murid (via Wali), Guru, Owner |
| Tech Stack | Next.js 14 (App Router), Supabase (Auth + DB + Storage + Realtime) |
| Styling | Tailwind CSS + shadcn/ui |
| Mobile First | Ya — breakpoint utama `max-w-md`, responsive ke desktop |
| Design Reference | Quamus Tahfidz App (card-based, clean, Islamic aesthetic) |
| Deployment | Vercel (Frontend) + Supabase Cloud (Backend) |
| Phase | Phase 1: Single-tenant (1 bimbel) |
| Roadmap | Phase 2: Multi-tenant SaaS |

---

## 2. ARSITEKTUR & FOLDER STRUCTURE

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (font, providers)
│   ├── page.tsx                      # Landing / redirect ke login
│   ├── (auth)/                       # Route group auth (no sidebar)
│   │   ├── login/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/                  # Route group dashboard (dengan layout)
│   │   ├── layout.tsx                # Shell: bottom nav mobile / sidebar desktop
│   │   ├── murid/
│   │   │   ├── page.tsx              # Overview murid
│   │   │   ├── kelas/page.tsx        # Kelas yang diikuti
│   │   │   ├── raport/page.tsx       # Raport nilai
│   │   │   └── catatan/page.tsx      # Catatan guru (khusus wali)
│   │   ├── guru/
│   │   │   ├── page.tsx              # Overview guru
│   │   │   ├── murid/
│   │   │   │   ├── page.tsx          # Daftar murid
│   │   │   │   └── [studentId]/
│   │   │   │       ├── page.tsx      # StudentDetailPage (wrapper)
│   │   │   │       ├── jadwal/page.tsx
│   │   │   │       ├── kehadiran/page.tsx
│   │   │   │       ├── hafalan/page.tsx
│   │   │   │       ├── tajwid/page.tsx
│   │   │   │       └── catatan/page.tsx
│   │   │   ├── absen/page.tsx        # Input absensi harian
│   │   │   └── materi/page.tsx       # Kelola materi
│   │   └── owner/
│   │       ├── page.tsx              # Overview owner
│   │       ├── murid/page.tsx
│   │       ├── guru/page.tsx
│   │       ├── kelas/page.tsx
│   │       ├── keuangan/page.tsx
│   │       └── pengaturan/page.tsx
│
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── shared/                       # Reusable lintas role
│   │   ├── AvatarCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── AttendanceBadge.tsx
│   │   ├── SurahProgressCard.tsx
│   │   ├── ScheduleTable.tsx
│   │   ├── TajwidLevelBadge.tsx
│   │   └── EmptyState.tsx
│   ├── murid/                        # Komponen khusus murid
│   ├── guru/                         # Komponen khusus guru
│   └── owner/                        # Komponen khusus owner
│
├── hooks/                            # Custom React hooks
│   ├── useAuth.ts
│   ├── useStudent.ts
│   ├── useAttendance.ts
│   ├── useHafalan.ts
│   ├── useSchedule.ts
│   └── useTenant.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client (createBrowserClient)
│   │   ├── server.ts                 # Server client (createServerClient)
│   │   └── middleware.ts             # Auth middleware helper
│   ├── helpers.ts                    # Helper functions (lihat section 6)
│   ├── constants.ts                  # Konstanta global
│   └── quranData.ts                  # Data surat + jumlah ayat Al-Quran
│
├── context/
│   ├── AuthContext.tsx               # User session + role
│   └── TenantContext.tsx             # Tenant context (SaaS-ready)
│
├── services/                         # Supabase query abstraction layer
│   ├── studentService.ts
│   ├── attendanceService.ts
│   ├── hafalanService.ts
│   ├── scheduleService.ts
│   ├── gradeService.ts
│   └── notesService.ts
│
├── middleware.ts                      # Next.js middleware (auth guard + role redirect)
├── types/
│   └── index.ts                      # TypeScript types & interfaces
└── utils/
    ├── validasi.ts                   # Khanza style: Validasi input & form
    ├── sekuel.ts                     # Khanza style: Helper query builder/wrapper (opsional)
    ├── roleGuard.ts                  # Role-based route protection
    ├── dateUtils.ts
    └── formatters.ts
```

---

## 2.5 MENTAL MAP UNTUK DEVELOPER SIMRS KHANZA

Bagi Anda yang terbiasa dengan arsitektur SIMRS Khanza (Java), berikut adalah padanannya di ekosistem Next.js + Supabase ini agar Anda mudah mengembangkannya secara mandiri:

| Konsep SIMRS Khanza | Padanan di Project Ini (Next.js) | Penjelasan |
|---|---|---|
| `Koneksi.java` | `lib/supabase/client.ts` & `server.ts` | File tunggal untuk membuka koneksi ke database Supabase. Anda cukup import file ini tanpa pusing mikirin URL/Key lagi. |
| `Validasi.java` | `utils/validasi.ts` | Tempat menaruh semua fungsi untuk mengecek inputan (misal: cek null, batas karakter, regex email/HP). |
| `Sekuel.java` (CRUD) | Folder `services/` | Di Khanza, SQL ditaruh di `Sekuel`. Di sini, kita buat file per modul (contoh: `services/studentService.ts`) yang isinya *Promise* untuk `simpan()`, `ubah()`, `hapus()`, dan `tampil()`. UI React murni hanya memanggil fungsi ini. |
| Tabel `set_aplikasi` | `tenants` (Phase 2) / `.env` (Phase 1) | Tempat menyimpan konfigurasi global bimbel (Nama, Logo, Warna Tema). |

---

## 3. NEXT.JS ROUTING CONVENTION

### 3.1 Middleware — Auth Guard + Role Redirect

```typescript
// middleware.ts (root)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Belum login → redirect ke /login
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Sudah login tapi akses /login → redirect ke dashboard sesuai role
  if (session && pathname === '/login') {
    const role = session.user.user_metadata?.role ?? 'murid';
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  // Role guard: guru tidak bisa akses /dashboard/owner, dst.
  if (session && pathname.startsWith('/dashboard')) {
    const role = session.user.user_metadata?.role ?? 'murid';
    const routeRole = pathname.split('/')[2]; // 'murid' | 'guru' | 'owner'
    if (routeRole && routeRole !== role && role !== 'owner') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
```

### 3.2 Supabase Client — Browser vs Server

```typescript
// lib/supabase/client.ts — dipakai di Client Components
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// lib/supabase/server.ts — dipakai di Server Components & Route Handlers
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
};
```

### 3.3 Layout Dashboard

```typescript
// app/(dashboard)/layout.tsx
// Render bottom navigation (mobile) atau sidebar (desktop)
// Cek role dari session, render nav items sesuai role
```

---

## 4. DATABASE SCHEMA (Supabase / PostgreSQL)

### 4.1 Tabel Utama

```sql
-- TENANTS (SaaS-ready, phase 1 = 1 row)
tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  address text,
  phone text,
  subscription_plan text DEFAULT 'basic',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- PROFILES (extend Supabase Auth)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  tenant_id uuid REFERENCES tenants(id),
  full_name text NOT NULL,
  role text CHECK (role IN ('murid', 'guru', 'owner')),
  avatar_url text,
  phone text,
  address text,
  date_of_birth date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- KELAS / PROGRAM
classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  name text NOT NULL,
  type text CHECK (type IN ('tahfidz', 'calistung', 'umum')),
  description text,
  price integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- ENROLLMENTS
enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  student_id uuid REFERENCES profiles(id),
  class_id uuid REFERENCES classes(id),
  parent_pin text, -- PIN rahasia untuk akses modul wali murid
  enrolled_at timestamptz DEFAULT now(),
  status text CHECK (status IN ('active', 'inactive', 'graduated'))
)

-- JADWAL BELAJAR (diset 1x saat daftar)
schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id),
  day_of_week int CHECK (day_of_week BETWEEN 0 AND 6),
  activity text NOT NULL,
  material_notes text,
  time_start time,
  time_end time,
  created_at timestamptz DEFAULT now()
)

-- ABSENSI
attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  enrollment_id uuid REFERENCES enrollments(id),
  guru_id uuid REFERENCES profiles(id),
  date date NOT NULL,
  status text CHECK (status IN ('H', 'I', 'A')),
  notes text,
  created_at timestamptz DEFAULT now()
)

-- PROGRESS HAFALAN
hafalan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id),
  guru_id uuid REFERENCES profiles(id),
  surah_number int NOT NULL,
  surah_name text NOT NULL,
  total_ayat int NOT NULL,
  ayat_reached int NOT NULL DEFAULT 0,
  session_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
)

-- DETAIL TAJWID ASSESSMENT
tajwid_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id),
  guru_id uuid REFERENCES profiles(id),
  session_date date NOT NULL,
  makhraj_level text CHECK (makhraj_level IN ('mulai', 'sedang', 'lancar')),
  makhraj_notes text,
  kelancaran_level text CHECK (kelancaran_level IN ('mulai', 'sedang', 'lancar')),
  kelancaran_notes text,
  tajwid_level text CHECK (tajwid_level IN ('mulai', 'sedang', 'lancar')),
  tajwid_notes text,
  created_at timestamptz DEFAULT now()
)

-- CATATAN GURU
teacher_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id),
  guru_id uuid REFERENCES profiles(id),
  note_date date NOT NULL,
  content text NOT NULL,
  is_visible_to_wali boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- MATERI
materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id),
  guru_id uuid REFERENCES profiles(id),
  class_id uuid REFERENCES classes(id),
  title text NOT NULL,
  description text,
  file_url text,
  type text CHECK (type IN ('pdf', 'video', 'link', 'text')),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- RAPORT
report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id),
  guru_id uuid REFERENCES profiles(id),
  period text NOT NULL,
  scores jsonb,
  summary text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

### 4.2 Row Level Security (RLS)

```sql
-- Aktifkan RLS di semua tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hafalan_progress ENABLE ROW LEVEL SECURITY;
-- dst untuk semua tabel

-- Policy: isolasi per tenant
CREATE POLICY "tenant_isolation" ON attendances
  USING (tenant_id = (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: guru hanya akses murid di tenant yang sama
CREATE POLICY "guru_own_students" ON hafalan_progress
  USING (
    enrollment_id IN (
      SELECT e.id FROM enrollments e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.tenant_id = p.tenant_id
    )
  );
```

---

## 5. ROLE & DASHBOARD SPEC

### 5.1 MURID / WALI MURID — `/dashboard/murid`

| Route | Komponen | Deskripsi |
|---|---|---|
| `/murid` | `StudentOverview` | Ringkasan kehadiran, hafalan terkini, jadwal hari ini |
| `/murid/kelas` | `MyClasses` | Kelas yang diikuti + status |
| `/murid/raport` | `ReportCard` | Nilai per periode |
| `/murid/catatan` | `TeacherNotes` | Catatan guru (Wali modul). Memerlukan input `parent_pin` sebelum tampil |

### 5.2 GURU — `/dashboard/guru`

| Route | Komponen | Deskripsi |
|---|---|---|
| `/guru` | `TeacherOverview` | Jumlah murid aktif, jadwal hari ini |
| `/guru/murid` | `StudentList` | Daftar murid per kelas |
| `/guru/murid/[studentId]` | `StudentDetailPage` | Profil lengkap murid (tab-based) |
| `/guru/murid/[studentId]/jadwal` | `ScheduleTab` | Jadwal belajar murid |
| `/guru/murid/[studentId]/kehadiran` | `AttendanceTab` | Riwayat & input kehadiran |
| `/guru/murid/[studentId]/hafalan` | `HafalanTab` | Progress hafalan + progress bar |
| `/guru/murid/[studentId]/tajwid` | `TajwidTab` | Makhraj, kelancaran, tajwid |
| `/guru/murid/[studentId]/catatan` | `NotesTab` | Catatan bebas guru |
| `/guru/absen` | `AttendanceForm` | Absen harian per kelas |
| `/guru/materi` | `MaterialManager` | CRUD materi |

#### StudentDetailPage — Tab Spec

**Tab 1: Jadwal Belajar**
```
Tabel: Hari | Kegiatan | Materi
Read-only. Diset saat enrollment.
Highlight row = hari ini.
```

**Tab 2: Kehadiran**
```
Kalender bulanan + tabel.
Badge: H (hijau) | I (kuning) | A (merah)
Statistik: X hadir dari Y pertemuan (Z%)
```

**Tab 3: Progress Hafalan**
```
Dropdown pilih surat → auto-load total ayat
Input: ayat dicapai (validasi: 0 ≤ input ≤ total_ayat)
ProgressBar + label "15/40 (37%)"
Riwayat sesi sebelumnya dalam tabel
```

**Tab 4: Tajwid Assessment**
```
3 aspek: Makhraj | Kelancaran | Tajwid
Per aspek: radio (mulai/sedang/lancar) + textarea catatan
Contoh: Makhraj → Sedang → "perlu latihan huruf qaf dan dhad"
```

**Tab 5: Catatan Guru**
```
Textarea bebas + toggle visibilitas ke wali
List catatan sebelumnya (tanggal + isi)
```

### 5.3 OWNER — `/dashboard/owner`

| Route | Komponen | Deskripsi |
|---|---|---|
| `/owner` | `OwnerOverview` | Total murid, guru, kehadiran rata-rata |
| `/owner/murid` | `StudentManager` | CRUD murid + enrollment |
| `/owner/guru` | `TeacherManager` | CRUD guru + assign kelas |
| `/owner/kelas` | `ClassManager` | CRUD kelas/program |
| `/owner/keuangan` | `FinanceReport` | SPP & pembayaran |
| `/owner/pengaturan` | `TenantSettings` | Logo, nama, kontak bimbel |

---

## 6. DATA HELPER — QURAN

```typescript
// lib/quranData.ts
export interface Surah {
  number: number;
  name: string;
  ayat: number;
}

export const QURAN_SURAHS: Surah[] = [
  { number: 1,   name: "Al-Fatihah",    ayat: 7   },
  { number: 2,   name: "Al-Baqarah",    ayat: 286 },
  { number: 3,   name: "Ali Imran",     ayat: 200 },
  // ... lengkap 114 surat
  { number: 78,  name: "An-Naba",       ayat: 40  },
  { number: 113, name: "Al-Falaq",      ayat: 5   },
  { number: 114, name: "An-Nas",        ayat: 6   },
];

export const getSurahByNumber = (num: number): Surah | undefined =>
  QURAN_SURAHS.find(s => s.number === num);

export const calcHafalanPercent = (ayatReached: number, totalAyat: number): number =>
  totalAyat > 0 ? Math.round((ayatReached / totalAyat) * 100) : 0;

export const validateAyatInput = (input: number, totalAyat: number): boolean =>
  input >= 0 && input <= totalAyat;
```

---

## 7. HELPER FUNCTIONS

```typescript
// lib/helpers.ts

// ── ROLES ─────────────────────────────────────────────────
export const ROLES = {
  MURID: 'murid',
  GURU:  'guru',
  OWNER: 'owner',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

export const isGuru  = (role?: string) => role === ROLES.GURU;
export const isMurid = (role?: string) => role === ROLES.MURID;
export const isOwner = (role?: string) => role === ROLES.OWNER;

// ── ATTENDANCE ────────────────────────────────────────────
export const ATTENDANCE_STATUS = {
  H: { label: 'Hadir', color: 'bg-green-500',  textColor: 'text-green-700'  },
  I: { label: 'Ijin',  color: 'bg-yellow-400', textColor: 'text-yellow-700' },
  A: { label: 'Alpha', color: 'bg-red-500',    textColor: 'text-red-700'    },
} as const;
export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

export const calcAttendanceRate = (records: { status: string }[]): number => {
  if (!records?.length) return 0;
  const hadir = records.filter(r => r.status === 'H').length;
  return Math.round((hadir / records.length) * 100);
};

// ── TAJWID LEVELS ─────────────────────────────────────────
export const TAJWID_LEVELS = {
  mulai:  { label: 'Mulai',  color: 'text-red-500',    bg: 'bg-red-100'    },
  sedang: { label: 'Sedang', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  lancar: { label: 'Lancar', color: 'text-green-600',  bg: 'bg-green-100'  },
} as const;
export type TajwidLevel = keyof typeof TAJWID_LEVELS;

// ── SCHEDULE ──────────────────────────────────────────────
export const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

export const getTodaySchedule = <T extends { day_of_week: number }>(
  schedules: T[]
): T[] => {
  const today = new Date().getDay();
  return schedules?.filter(s => s.day_of_week === today) ?? [];
};

export const getDayName = (dayIndex: number): string =>
  DAY_NAMES[dayIndex] ?? '-';

// ── PROGRESS BAR ──────────────────────────────────────────
export const getProgressColor = (percent: number): string => {
  if (percent >= 80) return 'bg-green-500';
  if (percent >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
};

// ── SUPABASE QUERY HELPER ─────────────────────────────────
// Tambahkan filter tenant_id otomatis ke semua query
export const withTenant = <T>(
  query: T & { eq: (col: string, val: string) => T },
  tenantId: string
): T => query.eq('tenant_id', tenantId);

// ── ENROLLMENT ────────────────────────────────────────────
export const isEnrollmentActive = (enrollment?: { status: string }): boolean =>
  enrollment?.status === 'active';

// ── FORMATTERS ────────────────────────────────────────────
export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount);

export const formatDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(dateStr));

export const formatShortDate = (dateStr: string): string =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short'
  }).format(new Date(dateStr));

// ── PROGRAM TYPES ─────────────────────────────────────────
export const PROGRAM_TYPES = {
  tahfidz:   { label: 'Tahfidz Al-Quran', icon: '📖' },
  calistung: { label: 'Calistung',         icon: '✏️' },
  umum:      { label: 'Umum',              icon: '📚' },
} as const;
```

---

## 8. TYPESCRIPT TYPES

```typescript
// types/index.ts

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  subscription_plan: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string;
  role: 'murid' | 'guru' | 'owner';
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
}

export interface Schedule {
  id: string;
  enrollment_id: string;
  day_of_week: number;
  activity: string;
  material_notes?: string;
  time_start?: string;
  time_end?: string;
}

export interface Attendance {
  id: string;
  enrollment_id: string;
  date: string;
  status: 'H' | 'I' | 'A';
  notes?: string;
}

export interface HafalanProgress {
  id: string;
  enrollment_id: string;
  surah_number: number;
  surah_name: string;
  total_ayat: number;
  ayat_reached: number;
  session_date: string;
  notes?: string;
}

export interface TajwidAssessment {
  id: string;
  enrollment_id: string;
  session_date: string;
  makhraj_level: 'mulai' | 'sedang' | 'lancar';
  makhraj_notes?: string;
  kelancaran_level: 'mulai' | 'sedang' | 'lancar';
  kelancaran_notes?: string;
  tajwid_level: 'mulai' | 'sedang' | 'lancar';
  tajwid_notes?: string;
}

export interface TeacherNote {
  id: string;
  enrollment_id: string;
  guru_id: string;
  note_date: string;
  content: string;
  is_visible_to_wali: boolean;
}
```

---

## 9. TENANT CONTEXT — SaaS-READY

```typescript
// context/TenantContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { Tenant } from '@/types';

const FIXED_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!; // Phase 1

const TenantContext = createContext<Tenant | null>(null);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    // Phase 1: fetch by fixed ID dari env
    fetchTenantById(FIXED_TENANT_ID).then(setTenant);

    // Phase 2 (uncomment nanti):
    // const slug = window.location.hostname.split('.')[0];
    // fetchTenantBySlug(slug).then(setTenant);
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
```

---

## 10. UI/UX GUIDELINES

- **Design System:** shadcn/ui + Tailwind CSS
- **Color Palette:**
  - Primary: `#0F172A` (Slate 900 - Biru Tua)
  - Accent: `#3B82F6` (Blue 500)
  - Surface: `#F8F9FA`
  - Warning: `#F59E0B`
  - Danger: `#EF4444`
- **Typography:** Inter + Cairo (untuk teks Arab/Al-Quran)
- **Card:** `rounded-2xl shadow-sm bg-white`
- **Mobile Nav:** Bottom navigation (Murid & Guru), max 5 item
- **Desktop Nav:** Sidebar collapsible (Owner)
- **Icons:** Lucide React
- **Loading:** Skeleton, bukan spinner
- **Empty State:** Ilustrasi SVG + tombol CTA

---

## 11. ENV VARIABLES

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx        # server-side only

# Phase 1: single tenant
NEXT_PUBLIC_TENANT_ID=uuid-bimbel-anda

# Phase 2: hapus TENANT_ID, pakai subdomain routing
```

---

## 12. SAAS UPGRADE PATH (Phase 2)

| Yang perlu diubah | Dari | Ke |
|---|---|---|
| TenantContext | `FIXED_TENANT_ID` dari env | Baca slug dari subdomain/URL |
| Routing | `/dashboard/guru` | `/:slug/dashboard/guru` atau subdomain |
| Middleware | Role guard saja | Tambah tenant resolution |
| Storage path | `/avatars/userId` | `/tenantId/avatars/userId` |
| Onboarding | Manual via Supabase Studio | Self-service register bimbel |
| Billing | - | Midtrans subscription + `subscription_plan` di tenants |

---