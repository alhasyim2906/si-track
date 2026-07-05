import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/app/ServiceWorkerRegistrar";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Server-side fetch of branding settings for metadata (favicon, app icons, title)
async function getBrandingMeta() {
  try {
    const items = await db.settings.findMany({
      where: {
        key: {
          in: [
            "app_name",
            "app_subtitle",
            "nama_kelurahan",
            "branding_logo_url",
            "branding_favicon_url",
            "branding_app_icon_192_url",
            "branding_app_icon_512_url",
          ],
        },
      },
    });
    const m: Record<string, string> = {};
    for (const it of items) m[it.key] = it.value || "";
    return m;
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getBrandingMeta();
  const appName = s.app_name || "SI-TRACK TANAH";
  const appSubtitle = s.app_subtitle || "Kelurahan Kuala Pembuang II";
  const title = `${appName} — ${appSubtitle}`;
  const description =
    "Sistem Informasi Tracking Pendaftaran Surat Tanah. Pantau status surat tanah Anda secara real-time melalui Nomor Register atau QR Code.";

  const favicon = s.branding_favicon_url || s.branding_logo_url || "/logo.svg";
  const icon192 = s.branding_app_icon_192_url || "/logo.svg";
  const icon512 = s.branding_app_icon_512_url || "/logo.svg";
  const appleIcon = s.branding_app_icon_192_url || s.branding_logo_url || "/logo.svg";

  return {
    metadataBase: new URL("http://localhost:3000"),
    title,
    description,
    keywords: [appName, "Tracking Surat Tanah", "Kelurahan Kuala Pembuang II", "Pelayanan Publik"],
    authors: [{ name: "Kelurahan Kuala Pembuang II" }],
    icons: {
      icon: [
        { url: favicon, type: favicon.endsWith(".svg") ? "image/svg+xml" : "image/png" },
        { url: "/logo.svg", type: "image/svg+xml" },
      ],
      shortcut: [favicon],
      apple: [
        { url: appleIcon, type: appleIcon.endsWith(".svg") ? "image/svg+xml" : "image/png" },
      ],
    },
    manifest: "/api/manifest",
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        { url: icon512, width: 512, height: 512, alt: appName },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [icon512],
    },
    appleWebApp: {
      capable: true,
      title: appName,
      statusBarStyle: "black-translucent",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#d4af37",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s = await getBrandingMeta();
  const appName = s.app_name || "SI-TRACK TANAH";
  // Preload favicon link in <head> for browsers that don't honor metadata.icons on dynamic routes
  const faviconUrl = s.branding_favicon_url || s.branding_logo_url || "/logo.svg";

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/manifest" />
        <meta name="theme-color" content="#d4af37" />
        <link rel="icon" href={faviconUrl} type={faviconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png"} />
        <link rel="apple-touch-icon" href={s.branding_app_icon_192_url || s.branding_logo_url || "/logo.svg"} />
        <meta name="application-name" content={appName} />
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
