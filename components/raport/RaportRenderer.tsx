/**
 * components/raport/RaportRenderer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Router/Selector yang secara otomatis memilih template raport yang tepat
 * berdasarkan class_type dari data raport.
 *
 * ✏️  Cara menambahkan template baru:
 *  1. Buat file RaportNamaKelas.tsx di folder /components/raport/
 *  2. Import di file ini
 *  3. Tambahkan case baru di switch statement di bawah
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { RaportTemplateProps } from "@/types/raport";
import RaportCalistung from "./RaportCalistung";
import RaportTahfidz from "./RaportTahfidz";
import RaportDefault from "./RaportDefault";

export default function RaportRenderer(props: RaportTemplateProps) {
  switch (props.raport.class_type) {
    case "calistung":
      return <RaportCalistung {...props} />;

    case "tahfidz":
      return <RaportTahfidz {...props} />;

    // ── Tambahkan case baru di sini untuk jenis kelas lain ──
    // case "bahasa_inggris":
    //   return <RaportBahasaInggris {...props} />;

    default:
      return <RaportDefault {...props} />;
  }
}
