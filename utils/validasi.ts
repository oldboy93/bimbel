/**
 * KHANZA STYLE VALIDATION HELPER
 * Semua fungsi untuk mengecek keabsahan input/string ada di sini.
 */

export const Validasi = {
  /**
   * Mengecek apakah string kosong, null, atau undefined
   */
  cekKosong: (teks: string | null | undefined): boolean => {
    return !teks || teks.trim().length === 0;
  },

  /**
   * Validasi format email
   */
  isEmailValid: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validasi nomor handphone (contoh: minimal 10 digit, maks 13)
   */
  isHPValid: (hp: string): boolean => {
    const re = /^[0-9]{10,13}$/;
    return re.test(hp);
  },

  /**
   * Cek apakah input hafalan ayat valid (tidak kurang dari 0 dan tidak lebih dari total ayat)
   */
  isAyatValid: (input: number, totalAyat: number): boolean => {
    return input >= 0 && input <= totalAyat;
  }
};
