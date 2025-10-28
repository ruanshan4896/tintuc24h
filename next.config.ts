import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vipwin358.com',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all hostnames for development
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['react-markdown', 'date-fns'],
  },
};

export default nextConfig;
