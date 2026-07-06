import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // pdfkit loads font metric files (.afm) from disk at runtime using
  // __dirname. Next.js's webpack bundler rewrites __dirname in a way that
  // breaks this lookup (the path becomes `/ROOT/node_modules/...` instead
  // of the real on-disk path). Listing pdfkit here tells Next.js to leave
  // the package as a native Node require() — __dirname resolves correctly
  // and the .afm files load from node_modules/pdfkit/js/data/.
  serverExternalPackages: ["pdfkit", "qrcode"],
};

export default nextConfig;
