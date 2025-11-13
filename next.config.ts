import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    domains: [
      "kegskzgwkhltieyddbby.supabase.co", // ✅ your Supabase project
      "lh3.googleusercontent.com", // optional: Google profile images
      "avatars.githubusercontent.com", // optional: GitHub profile images
    ],
  },
  devIndicators: false,
};

export default nextConfig;
