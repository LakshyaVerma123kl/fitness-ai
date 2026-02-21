import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  turbopack: {
    resolveAlias: {
      "@mediapipe/pose": "./utils/mediapipe-stub.js",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      { protocol: "https", hostname: "replicate.delivery" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig as NextConfig;
