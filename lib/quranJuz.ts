export interface Juz {
  number: number;
  name: string;
  halaman: number;
}

// Data lengkap 114 Surat Al-Quran
export const QURAN_JUZS: Juz[] = [
  { number: 1,  name: "Juz 1",  halaman: 21 },
  { number: 2,  name: "Juz 2",  halaman: 20 },
  { number: 3,  name: "Juz 3",  halaman: 20 },
  { number: 4,  name: "Juz 4",  halaman: 20 },
  { number: 5,  name: "Juz 5",  halaman: 20 },
  { number: 6,  name: "Juz 6",  halaman: 20 },
  { number: 7,  name: "Juz 7",  halaman: 20 },
  { number: 8,  name: "Juz 8",  halaman: 20 },
  { number: 9,  name: "Juz 9",  halaman: 20 },
  { number: 10, name: "Juz 10", halaman: 20 },
  { number: 11, name: "Juz 11", halaman: 20 },
  { number: 12, name: "Juz 12", halaman: 20 },
  { number: 13, name: "Juz 13", halaman: 20 },
  { number: 14, name: "Juz 14", halaman: 20 },
  { number: 15, name: "Juz 15", halaman: 20 },
  { number: 16, name: "Juz 16", halaman: 20 },
  { number: 17, name: "Juz 17", halaman: 20 },
  { number: 18, name: "Juz 18", halaman: 20 },
  { number: 19, name: "Juz 19", halaman: 20 },
  { number: 20, name: "Juz 20", halaman: 20 },
  { number: 21, name: "Juz 21", halaman: 20 },
  { number: 22, name: "Juz 22", halaman: 20 },
  { number: 23, name: "Juz 23", halaman: 20 },
  { number: 24, name: "Juz 24", halaman: 20 },
  { number: 25, name: "Juz 25", halaman: 20 },
  { number: 26, name: "Juz 26", halaman: 20 },
  { number: 27, name: "Juz 27", halaman: 20 },
  { number: 28, name: "Juz 28", halaman: 20 },
  { number: 29, name: "Juz 29", halaman: 20 },
  { number: 30, name: "Juz 30", halaman: 20 },
];

export const getHalamanByJuz = (num: number): Juz | undefined =>
  QURAN_JUZS.find(h => h.number === num);

export const getJuzPageRange = (num: number): { start: number; end: number } | undefined => {
  const index = QURAN_JUZS.findIndex(h => h.number === num);
  if (index === -1) return undefined;
  const start = QURAN_JUZS.slice(0, index).reduce((sum, h) => sum + h.halaman, 1);
  const end = start + QURAN_JUZS[index].halaman - 1;
  return { start, end };
};

export const calcHafalanPercent = (halamanReached: number, totalhalaman: number): number =>
  totalhalaman > 0 ? Math.round((halamanReached / totalhalaman) * 100) : 0;

export const validatehalamanInput = (input: number, totalhalaman: number): boolean =>
  input >= 0 && input <= totalhalaman;
