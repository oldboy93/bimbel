// lib/quranService.ts
// Wrapper untuk API quran.com (gratis, tanpa auth)
// Docs: https://api.quran.com/api/v4/

const BASE = "https://api.quran.com/api/v4";

export interface QuranVerse {
  id: number;
  verse_key: string; // e.g. "2:5"
  text_uthmani: string; // Teks Arab rasm Utsmani berharakat lengkap (disanitasi dari glyph asing)
  text_imlaei: string;  // Teks Arab rasm Imla'i / Standar Kemenag RI berharakat lengkap (100% kompatibel di semua HP)
  translations: { text: string }[]; // terjemahan ID
}

export interface QuranPage {
  verses: QuranVerse[];
  surah_number?: number;
  page_number?: number;
}

/**
 * Sanitasi karakter Unicode khusus Utsmani yang sering kali tidak didukung
 * font bawaan Android (seperti U+06DF tanda bulatan di atas alif 'waaw jamaah' -> kafaroo[tofu])
 * agar tidak memunculkan kotak silang/tofu di HP Android, namun TETAP MEMPERTAHANKAN semua harakat.
 */
function cleanUthmani(text: string): string {
  if (!text) return "";
  return text.replace(/[\u06DF\u06E0\u06E2\u06ED]/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeVerse(v: any): QuranVerse {
  const rawUthmani = v.text_uthmani ?? v.text_uthmani_simple ?? "";
  const rawImlaei = v.text_imlaei ?? rawUthmani;

  return {
    id: v.id,
    verse_key: v.verse_key,
    text_uthmani: cleanUthmani(rawUthmani),
    text_imlaei: rawImlaei,
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
      fields: "text_uthmani,text_imlaei",
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
      fields: "text_uthmani,text_imlaei",
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
      fields: "text_uthmani,text_imlaei",
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

