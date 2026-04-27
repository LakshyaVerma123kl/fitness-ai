/**
 * next.config.ts — Production-grade Next.js configuration
 *
 * Key decisions:
 * - @mediapipe/pose is stubbed out because TensorFlow.js MoveNet doesn't need it
 *   at runtime, but the package's import graph pulls it in. The stub prevents
 *   a build-time crash without affecting pose detection functionality.
 * - PWA is handled by @ducanh2912/next-pwa (disabled in dev to avoid SW noise).
 * - Security headers are injected for all routes to harden the deployment.
 * - `poweredByHeader: false` removes the "X-Powered-By: Next.js" header.
 */
import type { NextConfig } from "next";
import path from "path";
import withPwaInit from "@ducanh2912/next-pwa";

const withPwa = withPwaInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  // Hide framework fingerprint from response headers
  poweredByHeader: false,

  // Alias @mediapipe/pose to a no-op stub for both bundlers
  turbopack: {
    resolveAlias: {
      "@mediapipe/pose": "./utils/mediapipe-stub.js",
    },
  },
  webpack: (config: any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@mediapipe/pose": path.resolve(__dirname, "utils/mediapipe-stub.js"),
    };
    return config;
  },

  // Whitelist external image domains used by the AI image generation pipeline
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      { protocol: "https", hostname: "replicate.delivery" },
    ],
  },

  // Production-grade security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Clickjacking protection
          { key: "X-Frame-Options", value: "DENY" },
          // XSS filter (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Control referrer information sent with requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features the app doesn't need
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },

  experimental: {
    serverActions: {
      // Allow the production domain and localhost
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default withPwa(nextConfig);
