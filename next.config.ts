import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/techedgemarket_ecommerce",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "5.imimg.com" },
      { protocol: "https", hostname: "3.imimg.com" },
      { protocol: "https", hostname: "pgwkoepprueppoajrrug.supabase.co" },
    ],
  },
};

export default nextConfig;