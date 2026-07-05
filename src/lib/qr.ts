// SI-TRACK TANAH — QR code generator (server-side data URL)
import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: {
      dark: "#0a1628",
      light: "#ffffff",
    },
  });
}
