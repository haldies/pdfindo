import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  // Empty turbopack config to acknowledge webpack config
  turbopack: {},
  webpack: (config) => {
    // Exclude pdfjs-dist from server-side bundle
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    
    return config;
  },
};

export default nextConfig;
