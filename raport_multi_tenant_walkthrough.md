# Panduan Penggunaan & Pembuktian Multi-Tenant: Modul Raport Pluggable Template
> [!NOTE]
> Panduan ini mendokumentasikan fungsionalitas penuh dari sistem **Raport Pluggable Template** terpisah untuk kelas **Calistung** dan **Tahfidz**, lengkap dengan petunjuk langkah demi langkah untuk menguji pembuktian isolasi data **Multi-Tenant SaaS**.

---

## 👥 Data Akun untuk Pengujian & Validasi

Berikut adalah daftar akun pengujian yang telah terkonfigurasi di database untuk kedua tenant (semua password adalah **`Bimbel123!`**):

### 🏢 Tenant 1: Bimbel Al-Hikmah (`al-hikmah`)
| Peran | Nama Pengguna | Surel (Email) | Kelas Asal | Tipe Kelas |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | Admin Owner | `admin@alhanif.online` | - | - |
| **Guru** | Ustadz Ahmad Fauzi | `ustadz.ahmad@alhanif.online` | - | - |
| **Murid 1** | Muhammad Ali Akbar | `murid.ali@alhanif.online` | Tahfidz Pagi — Kelas A | **Tahfidz** |
| **Murid 2** | Umar bin Khattab Jr | `murid.umar@alhanif.online` | Calistung Kelas A | **Calistung** |

### 🏢 Tenant 2: Bimbel Al-Fatih (`al-fatih`)
| Peran | Nama Pengguna | Surel (Email) | Kelas Asal | Tipe Kelas |
| :--- | :--- | :--- | :--- | :--- |
| **Guru** | Ustadz Hasan Al-Fatih | `ustadz.hasan@alhanif.online` | - | - |
| **Murid** | Zayd Ar-Rayyan | `murid.zayd@alhanif.online` | Calistung Super Al-Fatih | **Calistung** |

---

## ⚡ Langkah 1: Migrasi Skema Database
Sebelum memulai pengujian, pastikan Anda telah menjalankan perintah SQL berikut pada **Supabase SQL Editor** untuk memperbarui skema tabel `report_cards`:

```sql
ALTER TABLE report_cards
  ADD COLUMN IF NOT EXISTS class_type text DEFAULT 'umum',
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_report_cards_class_type
  ON report_cards(class_type);
```

---

## 🔄 Langkah 2: Menjalankan Server Lokal
Pastikan server lokal Next.js Anda berjalan:
```bash
npm run dev
```
Buka browser dan navigasikan ke `http://localhost:3000`.

---

## 📝 Langkah 3: Walkthrough Pembuatan Raport (Sisi Guru)

### 🟢 Skenario A: Mengisi Raport Tahfidz (Murid: Muhammad Ali Akbar)
1. **Masuk ke Aplikasi:**
   - Akses halaman login di `http://localhost:3000/login`.
   - Masuk menggunakan akun **Guru Tenant 1**: `ustadz.ahmad@alhanif.online` (Sandi: `Bimbel123!`).
   - Perhatikan popup loading dinamis yang menampilkan *"Masuk ke Bimbel Al-Hikmah..."* sebagai bukti deteksi tenant sukses.
2. **Buka Profil Murid:**
   - Masuk ke menu **Daftar Murid**.
   - Pilih murid bernama **Muhammad Ali Akbar**.
3. **Mengisi Raport:**
   - Klik tab **Raport** (tab baru di sisi kanan).
   - Klik tombol **Buat Raport**.
   - Masukkan periode penilaian, misalnya: `Semester Ganjil 2026/2027`.
   - Pada section **Capaian Hafalan**, klik **Tambah** dan isi:
     * *Materi:* `Surat An-Nas`, *Status:* `Lancar`, *Catatan:* `Hafal tanpa hambatan`.
     * *Materi:* `Surat Al-Falaq`, *Status:* `Dalam Proses`, *Catatan:* `Perlu memperlancar ayat ke-3`.
   - Pada bagian **Tajwid & Adab**, atur level (contoh: Makharijul Huruf -> *Lancar*, Kelancaran -> *Sedang*, dll).
   - Tulis catatan guru: *“Ali menunjukkan ketekunan luar biasa dalam menghafal juz 30, pertahankan!”*.
   - Klik **Simpan sebagai Draft**. Raport akan muncul di daftar berstatus **Draft** (tidak terlihat oleh murid).
4. **Publikasikan Raport:**
   - Pada daftar raport, klik tombol **Publikasi** berwarna hijau.
   - Konfirmasi dialog persetujuan. Status raport kini berubah menjadi **Publik** (siap diakses murid/orang tua).

---

### 🔵 Skenario B: Mengisi Raport Calistung (Murid: Umar bin Khattab Jr)
1. **Pilih Murid Calistung:**
   - Masih masuk sebagai Ustadz Ahmad, kembali ke **Daftar Murid** dan pilih **Umar bin Khattab Jr**.
2. **Mengisi Raport:**
   - Masuk ke tab **Raport** dan klik **Buat Raport**.
   - Masukkan periode, misalnya: `Mei 2026`.
   - Anda akan melihat antarmuka form **otomatis berubah** menyajikan indikator **Target Membaca, Menulis, dan Menghitung** khas Calistung (tanpa kolom input Hafalan/Tajwid).
   - Atur level penilaian dari *Belum* hingga *Sangat Baik* untuk setiap komponen.
   - Isi catatan guru dan rekomendasi tindak lanjut di rumah.
   - Klik **Simpan sebagai Draft**, lalu klik **Publikasi**.

---

## 🔒 Langkah 4: Pembuktian Isolasi Data Multi-Tenant (SaaS Verification)
Untuk membuktikan bahwa sistem SaaS terisolasi dengan aman menggunakan *Row Level Security* (RLS) di Supabase:

1. **Keluar** dari akun Ustadz Ahmad.
2. **Masuk** menggunakan akun **Guru Tenant 2 (Bimbel Al-Fatih)**:
   - Surel: `ustadz.hasan@alhanif.online` (Sandi: `Bimbel123!`).
   - Popup loading akan menampilkan *"Masuk ke Bimbel Al-Fatih..."*.
3. **Verifikasi Keamanan:**
   - Buka menu **Daftar Murid**.
   - **Hasil:** Anda **hanya** akan melihat **Zayd Ar-Rayyan** di dalam daftar.
   - Murid dari Tenant 1 (Ali Akbar, Umar, Fatimah, dll.) **sama sekali tidak muncul** dan tidak dapat diakses baik lewat UI maupun modifikasi URL manual, karena diisolasi total oleh kebijakan database RLS!

---

## 🖨️ Langkah 5: Mengakses & Mencetak Raport (Sisi Murid / Orang Tua)

1. **Masuk sebagai Murid:**
   - Masuk menggunakan akun Murid Tenant 1: `murid.ali@alhanif.online` (Sandi: `Bimbel123!`).
2. **Buka Menu Raport:**
   - Masuk ke menu **Raport Belajar** di navigasi utama.
   - Anda akan melihat daftar raport yang sudah diterbitkan.
   - Klik pada periode raport `Semester Ganjil 2026/2027` untuk membukanya.
   - **Hasil:** Halaman akan merender **Template Raport Tahfidz resmi** berhias aksen hijau emerald premium, lengkap dengan tabel hafalan, grafik tajwid, dan catatan guru.
3. **Cetak Raport:**
   - Klik tombol **Cetak Raport** di pojok kanan atas.
   - Browser akan membuka jendela print dialog. Lembar raport telah dioptimalkan secara otomatis untuk menghasilkan cetakan dokumen fisik/PDF A4 yang rapi tanpa menyertakan elemen navigasi website.

---

## 🛠️ Panduan Kustomisasi Template untuk Pengembang
Semua kode template dibuat terisolasi dan modular sehingga dapat diubah dengan mudah tanpa merusak alur aplikasi utama.

- **Lokasi Kode File:**
  - [types/raport.ts](file:///d:/bimbel/types/raport.ts) — Berisi definisi struktur data raport.
  - [components/raport/RaportCalistung.tsx](file:///d:/bimbel/components/raport/RaportCalistung.tsx) — File desain tampilan raport Calistung.
  - [components/raport/RaportTahfidz.tsx](file:///d:/bimbel/components/raport/RaportTahfidz.tsx) — File desain tampilan raport Tahfidz.
  - [components/raport/RaportRenderer.tsx](file:///d:/bimbel/components/raport/RaportRenderer.tsx) — Router yang mendeteksi dan merender template berdasarkan `class_type`.

Jika Anda ingin mengubah visual kop surat atau menambah baris penilaian, Anda hanya perlu mengedit file `RaportCalistung.tsx` or `RaportTahfidz.tsx` langsung sesuai keinginan Anda.
