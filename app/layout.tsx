import type { Metadata } from "next";
import { Inter, Scheherazade_New } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const scheherazade = Scheherazade_New({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-quran',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Alhanif",
  description: "Sistem Manajemen Pembelajaran Calistung & Tahfidz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans antialiased", inter.variable, scheherazade.variable)}>
      <body>
        {children}
      </body>
    </html>
  );
}
