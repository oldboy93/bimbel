# Panduan Implementasi Fitur Raport Resmi & Tanda Tangan Guru

Dokumen ini menjelaskan rancangan arsitektur dan fungsionalitas baru yang ditambahkan ke modul **Raport Belajar** untuk mendukung tanda tangan digital guru pembimbing, penggantian pop-up primitif ke React Modals premium, dan konversi ekspor PDF dinamis pada gadget.

---

## 🚀 Ringkasan Fitur Utama

### 1. Eliminasi Pop-up Primitif (JS Alert / Confirm)
Seluruh interaksi dialog konfirmasi dan notifikasi peringatan di dashboard Guru kini menggunakan **React Modals** dan **Toast Alerts** kustom dengan visual premium:
*   **Toast Alert:** Notifikasi bergaya minimalis modern dengan ikon status (sukses/peringatan/error) yang muncul di sudut kanan bawah dengan efek transisi halus.
*   **Confirmation Modals:** Dialog box khusus untuk aksi kritis seperti menghapus draft raport atau mempublikasikan raport, lengkap dengan deskripsi konsekuensi tindakan.

### 2. Tanda Tangan Digital Guru Pembimbing (Canvas Drawing Pad)
Saat guru ingin mempublikasikan raport dari halaman detail murid:
*   **Pilihan Tanda Tangan:** Aplikasi otomatis memeriksa apakah guru tersebut sudah memiliki tanda tangan terdaftar di profilnya (`profiles.signature`).
*   **Reuse Signature:** Guru dapat memilih opsi "Gunakan Terdaftar" untuk mempercepat publikasi dengan tanda tangan yang sudah ada.
*   **Canvas Pad:** Guru dapat memilih opsi "Buat Baru" untuk menggambar tanda tangan baru langsung di layar menggunakan jari atau stylus. Touch-scrolling dinonaktifkan otomatis saat menggambar di canvas agar presisi.
*   **Auto-Sync:** Opsi "Simpan ke profil saya" menyimpan gambar base64 tanda tangan baru ke database profil guru agar dapat digunakan langsung pada periode berikutnya.
*   **History Integrity:** Tanda tangan di-embed langsung ke dalam payload JSON data raport saat diterbitkan, memastikan keaslian data historis raport meskipun guru memperbarui tanda tangan profil mereka di masa depan.

### 3. Download PDF Presisi Tinggi (Pengganti Cetak Browser)
Halaman raport murid telah ditingkatkan untuk mendukung pengunduhan PDF instan secara digital:
*   **CDN-Loaded html2pdf.js:** Script ekspor PDF dimuat secara dinamis saat tombol diklik untuk menjaga performa loading awal halaman.
*   **Scale Optimization:** Menggunakan skala render canvas sebesar `2.5` dengan opsi `useCORS: true` untuk menghasilkan hasil konversi grafis yang sangat tajam dan presisi tinggi tanpa merusak layout.
*   **Accordion Interface:** Murid dapat membuka accordion periode raport dan menekan tombol "Download" di masing-masing periode, yang secara otomatis mengunduh raport PDF dengan format nama file rapi, misalnya: `Raport_NamaMurid_Semester_1_2025_2026.pdf`.

---

## 🛠️ Detail Berkas yang Dimodifikasi

### 📁 [TabRaport.tsx](file:///d:/bimbel/app/%28dashboard%29/guru/murid/%5BstudentId%5D/TabRaport.tsx)
*   Menambahkan canvas drawing pad responsive dengan gesture detection.
*   Menambahkan state modal publikasi, modal hapus, dan antarmuka toast.
*   Menambahkan integrasi `profiles` table update untuk sinkronisasi tanda tangan.

### 📁 [page.tsx (Murid Raport)](file:///d:/bimbel/app/%28dashboard%29/murid/raport/page.tsx)
*   Mengganti `window.print()` dengan dynamic HTML rendering engine `html2pdf.js`.
*   Menambahkan status loading `isDownloading` pada accordion item agar user mengetahui progres pembuatan PDF.

### 📁 [RaportCalistung.tsx](file:///d:/bimbel/components/raport/RaportCalistung.tsx) & [RaportTahfidz.tsx](file:///d:/bimbel/components/raport/RaportTahfidz.tsx)
*   Menampilkan tanda tangan digital guru pembimbing dalam format gambar PNG transparan di bagian footer raport resmi.
