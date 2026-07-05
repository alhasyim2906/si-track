import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/app/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "SI-TRACK TANAH — Kelurahan Kuala Pembuang II",
  description:
    "Sistem Informasi Tracking Pendaftaran Surat Tanah. Pantau status surat tanah Anda secara real-time melalui Nomor Register atau QR Code.",
  keywords: ["SI-TRACK TANAH", "Tracking Surat Tanah", "Kelurahan Kuala Pembuang II", "Pelayanan Publik"],
  authors: [{ name: "Kelurahan Kuala Pembuang II" }],
  openGraph: {
    title: "SI-TRACK TANAH — Kelurahan Kuala Pembuang II",
    description: "Sistem Informasi Tracking Pendaftaran Surat Tanah",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "SI-TRACK TANAH",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d4af37" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <ServiceWorkerRegistrar />
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
