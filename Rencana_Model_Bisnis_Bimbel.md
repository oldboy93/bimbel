# STRATEGI MODEL BISNIS & REVENUE SHARING: BIMBEL & GURU (PROPOSAL CLIENT) 🚀

Proposal ini menyajikan analisis mendalam mengenai praktik terbaik (*best practices*) pengelolaan pendapatan ganda (*dual-sales*) antara pihak pengelola Bimbel (Pemilik) dengan para Guru (Tenaga Pendidik) berbasis data dan sistem aplikasi yang sedang berjalan saat ini.

---

## 📌 1. Latar Belakang & Dilema Operasional

Dalam pengelolaan Bimbingan Belajar (Bimbel) modern, pengelola sering kali menghadapi tantangan penyeimbangan peran guru:
*   **Sisi Administrasi:** Guru memiliki tanggung jawab harian mengisi data presensi (`attendances`), melapor progres hafalan (`hafalan_progress`), serta memberikan catatan evaluasi (`teacher_notes`). Ini adalah kebutuhan vital bagi operasional Bimbel guna menjaga transparansi dan laporan ke wali murid via WhatsApp GoWA.
*   **Sisi Komersial:** Guru membutuhkan insentif finansial tambahan agar termotivasi mengajar secara prima, berpromosi mencari murid baru secara mandiri, atau bahkan menjual modul edukasi ciptaan mereka sendiri.

---

## 📊 2. 3 Pilihan Model Bisnis & Skema Pendapatan (Best Practices)

### Model A: Skema Bagi Hasil Bulanan & Referral (Bagi Hasil Dinamis)
Model ini menempatkan Bimbel sebagai pintu pembayaran utama, dengan guru sebagai mitra pengajar berinsentif komisi pertumbuhan.

*   **Skema Kerja:**
    *   **Pendaftaran Jalur Bimbel:** Murid mendaftar kelas reguler melalui pemasaran internal Bimbel -> Guru pengampu kelas mendapatkan **porsi mengajar tetap** (misal: 40% dari biaya SPP bulanan murid tersebut).
    *   **Pendaftaran Jalur Guru (Referral):** Guru membawa murid baru secara mandiri menggunakan kupon referral unik -> Guru mendapat porsi tetap + **Bonus Komisi Penjualan** (misal: tambahan 15% dari transaksi SPP bulan pertama murid baru).
*   **Keunggulan:** Memotivasi guru untuk proaktif bertindak sebagai pemasar (*marketer*) bagi kemakmuran Bimbel.

---

### Model B: Skema Platform Marketplace (SaaS-Enabled Marketplace)
Bimbel menyediakan infrastruktur digital (Aplikasi & WhatsApp Gateway) dan ruang fisik, sementara guru bertindak sebagai kreator konten pendidikan mandiri.

*   **Skema Kerja:**
    *   **Kelas Reguler:** Mengikuti kurikulum standar Bimbel dengan porsi gaji flat/bagi hasil standar.
    *   **Modul & Kelas Premium Guru:** Guru diizinkan menerbitkan materi premium (seperti E-book latihan menulis interaktif atau seri video rekaman hafalan tajwid) di tab materi kelas mereka.
    *   **Platform Fee:** Murid membayar biaya satu kali (*one-time purchase*) untuk membuka materi premium tersebut. Bimbel memotong **Platform Fee sebesar 10% - 20%** sebagai biaya pemeliharaan sistem digital, dan sisanya langsung diserahkan kepada guru pencipta modul.
*   **Keunggulan:** Meningkatkan prestise guru sebagai *Content Creator*, menekan angka *churn rate* guru, dan memberikan pendapatan pasif (*passive income*) bagi Bimbel.

---

### Model C: Skema Hibrida (Gaji Administrasi Sesi + Bonus Retensi Murid)
Model ini secara efektif menyelesaikan masalah klasik di mana **guru malas atau terlambat mengisi administrasi harian di aplikasi**.

*   **Skema Kerja:**
    *   **Gaji Pokok Sesi (Base Pay):** Guru dibayar tarif tetap per sesi pertemuan mengajar. **Syarat pencairannya adalah kedisiplinan administrasi**: guru wajib menginput absensi harian (`attendances`) dan progres belajar anak dalam aplikasi maksimal 24 jam setelah kelas usai. Jika data administrasi kosong, gaji sesi tersebut ditangguhkan.
    *   **Bonus Retensi Murid (Incentive Pay):** Guru dibayar bonus flat tambahan per kepala murid aktif (`enrollments`) yang terus memperpanjang masa belajarnya di kelas guru tersebut setiap bulan.
*   **Keunggulan:** Menjamin data administrasi aplikasi selalu *up-to-date* dan akurat, serta memastikan guru mengajar dengan sepenuh hati agar murid tidak keluar dari kelas.

---

## 🛠️ 3. Pemetaan Teknis Berdasarkan Sistem Aplikasi Saat Ini

Seluruh model bisnis di atas **dapat langsung diterapkan hari ini tanpa memerlukan perubahan struktur kode program atau database**, karena rancangan tabel Supabase saat ini sudah mendukung skema hibrida tersebut secara dinamis:

| Komponen Tabel | Data yang Tersedia | Potensi Pemanfaatan Bisnis |
| :--- | :--- | :--- |
| **`classes`** | Menyimpan harga kelas (`price`) | Menjadi basis penentuan SPP bulanan murid dan porsi perhitungan komisi bagi hasil guru. |
| **`enrollments`** | Menghubungkan murid dengan kelas aktif | Digunakan untuk menghitung jumlah kepala murid aktif di bawah bimbingan guru secara *real-time* guna kalkulasi bonus bulanan (*Incentive Pay*). |
| **`attendances`** | Mencatat presensi harian oleh `guru_id` | Menjadi bukti validasi administrasi mengajar guru sebelum pencairan Gaji Pokok Sesi (*Base Pay*). |
| **`materials`** | Berkas ajar (PDF, Video, Tautan, Teks) oleh `guru_id` | Menjadi materi digital mandiri yang dapat "dikunci" dan dijual sebagai modul premium mandiri oleh guru. |

---

## 📈 4. Alur Keuangan Rekomendasi (Win-Win Sweet Spot)

```
                       [ PEMBAYARAN SPP / MODUL ]
                                   │
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
          [ Platform Fee: 10-20% ]    [ Bagi Hasil Guru: 40-50% ]
                     │                           │
                     ▼                           ▼
          [ Kas Bersih Bimbel ]          [ Pendapatan Guru ]
                                                 ▲
                                                 │ (Pencairan Otomatis)
                                        [ Gaji Pokok Mengajar ]
                                                 ▲
                                                 │ (Syarat Wajib)
                                   [ Disiplin Isi Administrasi ]
```

---

## 💡 5. Rekomendasi Solusi Strategis Terbaik (The Sweet Spot)

Untuk mendapatkan hasil optimal pada awal peluncuran, disarankan untuk mengadopsi **Skema Hibrida (Model C) dikombinasikan dengan Skema Referral (Model A)**:

1.  **Terapkan "Gaji Pokok per Sesi" bersyarat.** Guru wajib melengkapi data absensi murid di aplikasi agar gaji mengajarnya di sesi tersebut dapat divalidasi dan dicairkan. Ini menjamin sistem notifikasi WhatsApp GoWA Anda selalu memiliki data terbaru untuk dikirim ke orang tua.
2.  **Berikan "Bonus Komisi Referral" sebesar 15% - 20%** kepada setiap guru yang berhasil mengajak murid baru mendaftar di kelas Bimbel.
3.  **Berikan "Bonus Kepala Murid"** (misal: Rp 10.000 per murid aktif per bulan) yang melekat pada performa guru mengampu kelas. Semakin banyak murid yang bertahan dan lulus dengan raport memuaskan, semakin tinggi penghasilan guru.

Formula ini terbukti sangat ampuh menjaga **kedisiplinan operasional internal Bimbel** sekaligus **menstimulasi kewirausahaan guru** demi kemakmuran finansial bersama.
