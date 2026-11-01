import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      { source: "/bibis", destination: "/matchups/bib-chw", permanent: false },
      { source: "/", destination: "/matchups", permanent: false },
      { source: "/thursday", destination: "/matchups", permanent: false },
      { source: "/thursday/:path*", destination: "/matchups", permanent: false },
      { source: "/simulator", destination: "/playoffs", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
