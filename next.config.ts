import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Biar bisa load gambar dari mana aja
      },
    ],
  },
};

export default nextConfig;