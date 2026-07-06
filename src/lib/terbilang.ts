// SI-TRACK TANAH — Rupiah-to-Indonesian-words ("terbilang") helper
// Used by the printable Kwitansi Pembayaran to spell out the nominal amount
// in formal Indonesian (e.g., 150000 -> "Seratus Lima Puluh Ribu Rupiah").
//
// This is a pure, dependency-free implementation that supports the full
// 32-bit integer range (up to ~2.1 billion Rupiah, more than enough for
// kelurahan-level operational fees). Zero is rendered as "Nol Rupiah".

const SATUAN: string[] = [
  "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
  "Sepuluh", "Sebelas",
];

/**
 * Convert an integer 0..999 to Indonesian words (no trailing "Rupiah").
 * Helper used by the main `terbilang` function below.
 */
function ratusan(n: number): string {
  if (n < 12) return SATUAN[n] || "";
  if (n < 20) return `${SATUAN[n - 10]} Belas`;
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const sisa = n % 10;
    return `${SATUAN[puluh]} Puluh${sisa ? " " + SATUAN[sisa] : ""}`.trim();
  }
  // 100..999
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  // "Seratus" instead of "Satu Ratus" for the leading 1
  const ratusStr = ratus === 1 ? "Seratus" : `${SATUAN[ratus]} Ratus`;
  return sisa === 0 ? ratusStr : `${ratusStr} ${ratusan(sisa)}`;
}

/**
 * Convert an integer to formal Indonesian words.
 * Supports up to the triliun (trillion) range, which is far beyond any
 * realistic kelurahan operational fee.
 *
 * Example: terbilang(150000) === "Seratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(n: number): string {
  // Handle negative numbers (shouldn't happen for biaya, but be safe).
  if (n < 0) return `Minus ${terbilang(-n)}`;
  if (n === 0) return "Nol Rupiah";

  // Slice into groups of 3 digits (ribu, juta, miliar, triliun).
  // We work from least-significant to most-significant, then reverse.
  const groups: number[] = [];
  let remaining = Math.floor(n);
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  // Labels per group index (0 = ones, 1 = ribu, 2 = juta, 3 = miliar, 4 = triliun)
  const LABELS = ["", "Ribu", "Juta", "Miliar", "Triliun"];

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const label = LABELS[i] || "";
    // Special case: 1 in the ribu group should be "Seribu", not "Satu Ribu"
    if (i === 1 && g === 1) {
      parts.push("Seribu");
      continue;
    }
    const groupWords = ratusan(g);
    parts.push(label ? `${groupWords} ${label}` : groupWords);
  }

  return `${parts.join(" ").trim()} Rupiah`;
}

/**
 * Format an integer Rupiah amount as a grouped string with the "Rp" prefix.
 * Example: formatRupiah(150000) === "Rp 150.000"
 */
export function formatRupiah(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "Rp 0";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/**
 * Parse a user-entered Rupiah string ("150.000", "Rp 150000", "150000") into
 * a plain integer. Returns null if the input is empty or unparseable.
 */
export function parseRupiah(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? null : n;
}
