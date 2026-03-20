import type { NextConfig } from "next";
import path from "path";
import withPwaInit from "@ducanh2912/next-pwa";

const withPwa = withPwaInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
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

export default withPwa(nextConfig);
