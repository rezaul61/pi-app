import type { NextConfig } from "next";

const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim().replace(/^https?:\/\//, ""))
  .filter(Boolean);

const previewOrigins = ["*.e2b.app", ...extraOrigins];

const nextConfig: NextConfig = {
  allowedDevOrigins: previewOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: [
        ...previewOrigins,
        "localhost:3000",
        "127.0.0.1:3000",
        "localhost:3100",
        "127.0.0.1:3100",
        "localhost:3104",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; upgrade-insecure-requests",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
