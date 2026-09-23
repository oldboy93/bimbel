// lib/quranService.ts
// Wrapper untuk API quran.com (gratis, tanpa auth)
// Docs: https://api.quran.com/api/v4/

const BASE = "https://api.quran.com/api/v4";

export interface QuranVerse {
  id: number;
  verse_key: string; // e.g. "2:5"
  text_uthmani: string; // teks Arab (simplified Uthmani, cross-platform)
  translations: { text: string }[]; // terjemahan ID
}

export interface QuranPage {
  verses: QuranVerse[];
  surah_number?: number;
  page_number?: number;
}

// Normalize raw API response: API returns "text_uthmani_simple" key
// but we map it to "text_uthmani" for consistency in the interface
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVerse(v: any): QuranVerse {
  return {
    id: v.id,
    verse_key: v.verse_key,
    // API returns text_uthmani_simple when that field is requested
    text_uthmani: v.text_uthmani_simple ?? v.text_uthmani ?? "",
    translations: v.translations ?? [],
  };
}

/**
 * Ambil ayat-ayat dari surah tertentu, range optional
 */
export async function getVersesBySurah(
  surahNumber: number,
  from: number = 1,
  to?: number
): Promise<QuranVerse[]> {
  try {
    const params = new URLSearchParams({
      translations: "33", // Terjemahan Bahasa Indonesia (Kemenag)
      fields: "text_uthmani_simple",
      per_page: "286",
      page: "1",
    });

    const res = await fetch(`${BASE}/verses/by_chapter/${surahNumber}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let verses: QuranVerse[] = (data.verses ?? []).map(normalizeVerse);

    // Filter range jika diminta
    if (to !== undefined) {
      verses = verses.filter((v) => {
        const ayatNum = parseInt(v.verse_key.split(":")[1], 10);
        return ayatNum >= from && ayatNum <= to;
      });
    } else if (from > 1) {
      verses = verses.filter((v) => {
        const ayatNum = parseInt(v.verse_key.split(":")[1], 10);
        return ayatNum >= from;
      });
    }

    return verses;
  } catch (err) {
    console.error("[quranService] getVersesBySurah error:", err);
    return [];
  }
}

/**
 * Ambil ayat-ayat dari halaman mushaf tertentu (1–604)
 */
export async function getVersesByPage(pageNumber: number): Promise<QuranVerse[]> {
  try {
    const params = new URLSearchParams({
      translations: "33",
      fields: "text_uthmani_simple",
      per_page: "50",
      page: "1",
    });

    const res = await fetch(`${BASE}/verses/by_page/${pageNumber}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.verses ?? []).map(normalizeVerse);
  } catch (err) {
    console.error("[quranService] getVersesByPage error:", err);
    return [];
  }
}

/**
 * Ambil ayat-ayat dari juz tertentu (1–30)
 */
export async function getVersesByJuz(juzNumber: number): Promise<QuranVerse[]> {
  try {
    const params = new URLSearchParams({
      translations: "33",
      fields: "text_uthmani_simple",
      per_page: "300",
      page: "1",
    });

    const res = await fetch(`${BASE}/verses/by_juz/${juzNumber}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.verses ?? []).map(normalizeVerse);
  } catch (err) {
    console.error("[quranService] getVersesByJuz error:", err);
    return [];
  }
}
