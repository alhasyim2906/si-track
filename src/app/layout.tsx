import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SI-TRACK TANAH — Kelurahan Kuala Pembuang II",
  description:
    "Sistem Informasi Tracking Pendaftaran Surat Tanah. Pantau status surat tanah Anda secara real-time melalui Nomor Register atau QR Code.",
  keywords: ["SI-TRACK TANAH", "Tracking Surat Tanah", "Kelurahan Kuala Pembuang II", "Pelayanan Publik"],
  authors: [{ name: "Kelurahan Kuala Pembuang II" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
