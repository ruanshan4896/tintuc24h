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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['react-markdown', 'date-fns', 'lucide-react'],
  },
  // Optimize production build
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  // Strict mode for better performance
  reactStrictMode: true,
  // TypeScript config
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
