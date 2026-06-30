import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
    <html lang="id" className={cn("font-sans antialiased", inter.variable)}>
      <body>
        {children}
      </body>
    </html>
  );
}
