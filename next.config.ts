import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/techedgemarket_ecommerce",
  images: {
    unoptimized: true, // required for static export
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "5.imimg.com" },
      { protocol: "https", hostname: "3.imimg.com" },
    ],
  },
};

export default nextConfig;