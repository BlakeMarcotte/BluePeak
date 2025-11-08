import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for @react-pdf/renderer compatibility with Next.js App Router
  serverExternalPackages: ['@react-pdf/renderer'],
};

export default nextConfig;
