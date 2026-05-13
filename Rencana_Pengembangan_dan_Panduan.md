# 📋 Rencana Pengembangan & Panduan Penggunaan Aplikasi Bimbel

Dokumen ini berisi rencana kerja pengembangan fitur untuk minggu depan, langkah-bagian (*walkthrough*), daftar tugas (*task list*), serta panduan operasional lengkap untuk semua peran pengguna (Owner, Guru, dan Murid/Wali).

---

## 🚀 Bagian I: Rencana Pengembangan Minggu Depan

Berikut adalah langkah pengembangan teknis (*walkthrough*) dan daftar tugas (*task list*) untuk dua fitur utama minggu depan:

### 📄 Fitur 1: Cetak Raport PDF Resmi (A4 Layout)
Mengubah cetakan halaman raport menjadi dokumen PDF formal berstandar lembaga pendidikan Islam.

#### **Walkthrough Teknis:**
1. **Print Stylesheet Optimization:** Menggunakan media query `@media print` untuk menyembunyikan semua elemen navigasi, sidebar, header dashboard, dan tombol cetak (`no-print`).
2. **Kop Surat Resmi:** Menampilkan kop surat formal lembaga Pendidikan Al-Qur'an pada bagian atas dokumen hanya saat dicetak.
3. **Layouting Grid A4:** Memastikan margin cetak stabil pada ukuran kertas A4 tanpa terpotong (*page-break rules*).
4. **Blok Tanda Tangan:** Menata tata letak tanda tangan Ustadz/Ustadzah pembimbing dan Wali Murid agar sejajar di bagian bawah halaman.

#### **Daftar Tugas (Task List):**
- [ ] Menyusun desain Kop Surat Formal Lembaga di komponen `MuridRaportPage` (`app/(dashboard)/murid/raport/page.tsx`).
- [ ] Menambahkan style CSS `@media print` khusus untuk mereset background warna abu-abu menjadi putih polos demi hemat tinta printer.
- [ ] Mengatur *page-break* otomatis pada tabel nilai agar tidak terpotong di tengah halaman.
- [ ] Menambahkan kolom tanda tangan resmi guru pembimbing dan orang tua yang sejajar secara horizontal (*flexbox alignment*).
- [ ] Menguji keselarasan cetak menggunakan fitur PDF preview browser.

---

### 💬 Fitur 2: Integrasi WhatsApp Gateway (GoWA)
Mengirimkan notifikasi WhatsApp secara real-time ke nomor HP orang tua/wali murid saat guru mencatat data kelas.

#### **Walkthrough Teknis:**
1. **Konfigurasi API Gateway:** Menghubungkan aplikasi dengan gateway API GoWA (`go-whatsapp-web-multidevice`) menggunakan utilitas yang sudah disiapkan di [gowa.ts](file:///d:/bimbel/lib/gowa.ts).
2. **Triggers Event di Database/Services:** Menyisipkan panggilan API GoWA di dalam fungsi layanan absensi dan perkembangan hafalan.
3. **Penyusunan Templat Pesan:** Membuat pesan notifikasi otomatis yang ramah, sopan, dan informatif (menggunakan salam Islam, detail progres, dan link akses).

#### **Daftar Tugas (Task List):**
- [ ] Mengonfigurasi variabel lingkungan API GoWA di `.env.local` (`GOWA_API_URL` dan `GOWA_API_TOKEN`).
- [ ] Menambahkan trigger notifikasi WhatsApp pada proses input kehadiran murid (`tambahAbsensi` di `services/attendanceService.ts`).
- [ ] Menambahkan trigger notifikasi progres hafalan baru (`tambahRiwayatHafalan` di `services/hafalanService.ts`).
- [ ] Menyusun templat pesan WhatsApp otomatis yang dinamis (contoh: *"Assalamu'alaikum Wr. Wb. Ayah/Bunda, Ananda Ali hari ini telah menyelesaikan hafalan Surah An-Nas ayat 1-6 dengan kelancaran Sangat Baik..."*).
- [ ] Menangani error penanganan (*graceful degradation*) jika API GoWA offline agar tidak menghentikan penyimpanan database utama.

---

## 📖 Bagian II: Panduan Penggunaan Aplikasi (Multi-User Guide)

Gunakan panduan operasional ini sebagai acuan demonstrasi ke klien atau instruksi bagi pengguna bimbel.

### 👑 1. Peran: OWNER (Pemilik Bimbel)
Akses administratif penuh untuk memantau performa bisnis dan mengelola operasional bimbel.

*   **Aktivitas Utama:**
    *   **Dashboard Utama:** Memantau ringkasan pendapatan bulanan, jumlah guru aktif, jumlah murid aktif, dan grafik pertumbuhan kelas.
    *   **Manajemen Akun Guru & Murid:** Menambahkan data guru baru, menyetujui pendaftaran murid, serta menonaktifkan akun.
    *   **Manajemen Kelas & Alokasi:** Membuat kelas baru (misal: "Tahfidz Pagi — Kelas A"), menetapkan ustadz pengajar, dan mendaftarkan murid ke kelas tersebut.
    *   **Laporan Keuangan:** Memantau arus kas pembayaran SPP bulanan murid dan pengeluaran bimbel.

---

### 🎓 2. Peran: GURU (Ustadz / Ustadzah)
Ujung totem kegiatan belajar mengajar, bertanggung jawab atas administrasi harian murid.

*   **Aktivitas Utama:**
    *   **Input Absensi Kelas:** Membuka menu Kehadiran harian untuk mencetak status kehadiran (Hadir, Sakit, Izin, Alpa) seluruh murid di kelas sekaligus dalam sekali ketukan.
    *   **Pencatatan Hafalan Qur'an:**
        *   Membuka detail profil murid, masuk ke tab **Hafalan**.
        *   Sistem secara cerdas otomatis mengisi surah kelanjutan berikutnya (*sequential prefill*).
        *   Gunakan tombol sekali-sentuh cepat (`-1 Ayat`, `+1 Ayat`, `Set Selesai`) untuk mempermudah penilaian hafalan tanpa mengetik manual.
    *   **Penilaian Tajwid Berkala:**
        *   Membuka tab **Tajwid** untuk menilai aspek Makhroj, Kelancaran, dan Tajwid secara berkala.
        *   Sistem otomatis memuat nilai terakhir dari riwayat agar guru tidak perlu mengklik opsi dropdown dari awal (*smart-prefill*).
    *   **Catatan Guru untuk Orang Tua:**
        *   Membuka tab **Catatan** untuk menulis pesan khusus kepada wali murid (bisa disetel visibilitasnya: *Tampilkan ke Wali* atau *Sembunyikan*).

---

### 👨‍👩‍👦 3. Peran: MURID & ORANG TUA (Wali Murid)
Akses terisolasi untuk melihat pencapaian prestasi dan materi pembelajaran murid.

*   **Aktivitas Utama:**
    *   **Dashboard Belajar:** Memantau ringkasan kelas aktif murid, jumlah sesi setoran hafalan, dan persentase tingkat kehadiran belajar.
    *   **LMS Pembelajaran Mandiri:** Membuka menu **Kelas Saya** -> tab **Materi** untuk mempelajari video pembelajaran, dokumen PDF, atau tautan luar yang dibagikan oleh ustadz secara mandiri.
    *   **Membuka Catatan Terkunci PIN:**
        *   Membuka tab **Catatan Guru**.
        *   Masukkan 6 digit **PIN Wali Murid** (PIN default pengujian: `123456`) pada kotak input modern yang tersedia.
        *   Setelah PIN terverifikasi, catatan rahasia dari guru otomatis terbuka dengan transisi animasi halus.
    *   **Melihat & Cetak Raport:** Membuka menu **Raport** untuk melihat nilai prestasi berkala dan mengunduh/mencetak dokumen Raport PDF.

---

> [!NOTE]
> Semua data pengujian (seperti akun ustadz.ahmad@bimbel.com, ali@bimbel.com, dan PIN wali murid) sudah disiapkan dengan matang dalam sistem sehingga siap dipresentasikan kapan saja kepada klien.
