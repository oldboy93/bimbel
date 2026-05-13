/**
 * FORMATTER & CONSTANTS HELPER
 * Mirip dengan utilitas UI dan konstanta statis di Khanza.
 */

// ── ROLES ─────────────────────────────────────────────────
export const ROLES = {
  MURID: 'murid',
  GURU: 'guru',
  OWNER: 'owner',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

// ── ATTENDANCE ────────────────────────────────────────────
export const ATTENDANCE_STATUS = {
  H: { label: 'Hadir', color: 'bg-emerald-500', textColor: 'text-green-700' },
  I: { label: 'Ijin', color: 'bg-yellow-400', textColor: 'text-yellow-700' },
  A: { label: 'Alpha', color: 'bg-red-500', textColor: 'text-red-700' },
} as const;

// ── TAJWID LEVELS ─────────────────────────────────────────
export const TAJWID_LEVELS = {
  mulai: { label: 'Mulai', color: 'text-red-500', bg: 'bg-red-100' },
  sedang: { label: 'Sedang', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  lancar: { label: 'Lancar', color: 'text-green-600', bg: 'bg-green-100' },
} as const;

// ── SCHEDULE ──────────────────────────────────────────────
export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// ── FORMATTERS ────────────────────────────────────────────
export const Format = {
  rupiah: (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  },

  tanggalIndo: (dateStr: string): string => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateStr));
  },

  tanggalPendek: (dateStr: string): string => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateStr));
  }
};

// ── PROGRAM TYPES ──────────────────────────────────────────
export const PROGRAM_TYPES = {
  tahfidz: { label: 'Tahfidz Al-Quran', icon: '📖' },
  calistung: { label: 'Calistung', icon: '✏️' },
  umum: { label: 'Umum', icon: '📚' },
} as const;

// ── ROLE HELPERS ──────────────────────────────────────────
export const isGuru = (role?: string) => role === ROLES.GURU;
export const isMurid = (role?: string) => role === ROLES.MURID;
export const isOwner = (role?: string) => role === ROLES.OWNER;

// ── ATTENDANCE HELPERS ────────────────────────────────────
export const calcAttendanceRate = (records: { status: string }[]): number => {
  if (!records?.length) return 0;
  const hadir = records.filter(r => r.status === 'H').length;
  return Math.round((hadir / records.length) * 100);
};

// ── PROGRESS BAR COLOR ────────────────────────────────────
export const getProgressColor = (percent: number): string => {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
};

// ── HARI INI ──────────────────────────────────────────────
export const getTodaySchedule = <T extends { day_of_week: number }>(
  schedules: T[]
): T[] => {
  const today = new Date().getDay();
  return schedules?.filter(s => s.day_of_week === today) ?? [];
};

