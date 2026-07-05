/**
 * Resolve the correct MIME type for an icon URL based on its file extension.
 *
 * Why this exists:
 *   Next.js metadata `icons` entries accept a `type` hint. Declaring the wrong
 *   type (e.g. `image/png` for a JPEG favicon) makes browsers refuse to render
 *   the icon — the tab falls back to the default globe/blank icon even though
 *   the file itself is valid and reachable. This helper inspects the URL's
 *   extension and returns the precise MIME so the `<link rel="icon" type="…">`
 *   declaration always matches the actual bytes being served.
 *
 * Supported extensions: svg, png, jpg/jpeg, ico, webp, gif, bmp.
 * Unknown extensions fall back to `image/png` (the most widely supported
 * favicon type) so the link is still valid HTML.
 */
export function iconMimeFromUrl(url: string): string {
  if (!url) return "image/png";
  const m = url.toLowerCase().split("?")[0].match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || "";
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "ico":
      return "image/x-icon";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

/**
 * Append a cache-busting query parameter to a branding asset URL.
 *
 * Branding assets are saved with a random hash in their filename
 * (e.g. `favicon-556a771eba4d.jpeg`), so the URL already changes on each
 * upload. However, browsers cache favicons *extremely* aggressively and
 * sometimes key on the `<link>` href without re-validating. Appending
 * `?v=<short-hash>` derived from the filename guarantees that whenever the
 * underlying file changes the href string changes too, forcing a fresh fetch.
 *
 * For URLs that already carry a query string the version is appended with `&`.
 * Static default assets (e.g. `/logo.svg`) are returned unchanged.
 */
export function withIconCacheBust(url: string): string {
  if (!url) return url;
  // Only bust branding assets (they live under /branding/).
  if (!url.startsWith("/branding/")) return url;
  // Extract the hash portion already present in the filename and reuse it as
  // the version token — stable across renders for the same file, different
  // across uploads.
  const m = url.match(/-([a-f0-9]{6,})\./i);
  const v = m?.[1] || Date.now().toString(36);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${v}`;
}
