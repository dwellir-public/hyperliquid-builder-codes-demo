import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
    resolveAlias: {
      // Stub out Node-only modules that wallet/crypto deps try to import in the browser
      fs: { browser: "" },
      net: { browser: "" },
      tls: { browser: "" },
      // Optional deps that aren't needed at runtime
      "pino-pretty": { browser: "" },
      encoding: { browser: "" },
      "@react-native-async-storage/async-storage": { browser: "" },
    },
  },
  serverExternalPackages: ["pino-pretty", "encoding"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
