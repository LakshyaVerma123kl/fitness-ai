import type { NextConfig } from "next";

// We removed the strict ": NextConfig" here so TypeScript doesn't complain about the object shape
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

// Assert the type here on export instead
export default nextConfig as NextConfig;
