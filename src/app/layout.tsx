import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/app/ServiceWorkerRegistrar";
import { db } from "@/lib/db";
import { resolvePublicBaseUrl } from "@/lib/public-url";
import { iconMimeFromUrl, withIconCacheBust } from "@/lib/icon-mime";

/**
 * Branding metadata (favicon, app name, etc.) must reflect the latest DB
 * settings on every request — otherwise an admin who uploads a new favicon
 * would see the old one until the page cache expires. Force dynamic render.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Resolve icon URLs, then attach a cache-busting query so browsers always
  // fetch the latest bytes when an admin uploads a new asset (the filename
  // hash already changes per upload; the `?v=` token makes it unambiguous
  // even to aggressive favicon caches).
  const faviconRaw = s.branding_favicon_url || s.branding_logo_url || "/logo.svg";
  const icon192Raw = s.branding_app_icon_192_url || "/logo.svg";
  const icon512Raw = s.branding_app_icon_512_url || "/logo.svg";
  const appleIconRaw = s.branding_app_icon_192_url || s.branding_logo_url || "/logo.svg";

  const favicon = withIconCacheBust(faviconRaw);
  const icon192 = withIconCacheBust(icon192Raw);
  const icon512 = withIconCacheBust(icon512Raw);
  const appleIcon = withIconCacheBust(appleIconRaw);

  // Correct MIME per extension — declaring image/png for a JPEG favicon makes
  // browsers reject the icon. Derive precisely from the file extension.
  const faviconMime = iconMimeFromUrl(faviconRaw);
  const icon192Mime = iconMimeFromUrl(icon192Raw);
  const icon512Mime = iconMimeFromUrl(icon512Raw);
  const appleMime = iconMimeFromUrl(appleIconRaw);

  // Resolve the public base URL (from DB setting → env → fallback).
  // Used as metadataBase so OpenGraph / Twitter card / canonical URLs resolve
  // to the real public domain instead of http://localhost:3000.
  const publicBaseUrl = await resolvePublicBaseUrl();
  const metadataBaseUrl = publicBaseUrl
    ? new URL(publicBaseUrl)
    : new URL("http://localhost:3000");

  return {
    metadataBase: metadataBaseUrl,
    title,
    description,
    keywords: [appName, "Tracking Surat Tanah", "Kelurahan Kuala Pembuang II", "Pelayanan Publik"],
    authors: [{ name: "Kelurahan Kuala Pembuang II" }],
    icons: {
      icon: [
        { url: favicon, type: faviconMime },
        { url: "/logo.svg", type: "image/svg+xml" },
      ],
      shortcut: [{ url: favicon, type: faviconMime }],
      apple: [
        { url: appleIcon, type: appleMime },
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
  // Preload favicon link in <head> for browsers that don't honor metadata.icons on dynamic routes.
  // Cache-busted + correct MIME so a freshly uploaded JPEG/WEBP favicon is
  // rendered instead of rejected as a wrong-type asset.
  const faviconRaw = s.branding_favicon_url || s.branding_logo_url || "/logo.svg";
  const faviconUrl = withIconCacheBust(faviconRaw);
  const faviconMime = iconMimeFromUrl(faviconRaw);
  const appleRaw = s.branding_app_icon_192_url || s.branding_logo_url || "/logo.svg";
  const appleUrl = withIconCacheBust(appleRaw);
  const appleMime = iconMimeFromUrl(appleRaw);

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/api/manifest" />
        <meta name="theme-color" content="#d4af37" />
        <link rel="icon" href={faviconUrl} type={faviconMime} />
        <link rel="shortcut icon" href={faviconUrl} type={faviconMime} />
        <link rel="apple-touch-icon" href={appleUrl} type={appleMime} />
        <meta name="application-name" content={appName} />
      </head>
      <body
        suppressHydrationWarning
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
