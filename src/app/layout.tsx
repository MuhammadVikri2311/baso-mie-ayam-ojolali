import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import FloatingAI from "@/components/FloatingAI";

export const metadata: Metadata = {
  title: "UMKM Baso & Mie Ayam Ojolali",
  description: "Sistem Pemesanan Baso & Mie Ayam Ojolali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col font-sans text-stone-800 antialiased selection:bg-orange-200 selection:text-orange-900">
        <Providers>
          <Navbar />
          <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <FloatingAI />
        </Providers>
      </body>
    </html>
  );
}
