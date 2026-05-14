import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/techedgemarket_ecommerce",
  images: {
    unoptimized: true, // required for static export
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }
    ],
  },
};

export default nextConfig;