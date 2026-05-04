import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  async redirects() {
    return [
      { source: "/qa", destination: "/ai", permanent: false },
      { source: "/signals", destination: "/feed", permanent: false },
      { source: "/news", destination: "/feed", permanent: false },
      { source: "/gex", destination: "/stock/SPY/gex", permanent: false },
    ];
  },
};

export default nextConfig;
