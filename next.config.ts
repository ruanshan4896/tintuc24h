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
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.vnecdn.net', // VnExpress CDN
      },
      {
        protocol: 'https',
        hostname: '*.vnexpress.net', // VnExpress
      },
      {
        protocol: 'https',
        hostname: 'www.vinmec.com', // Vinmec images
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all hostnames for development
      },
    ],
    // Disable image optimization to avoid Vercel limits
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['react-markdown', 'date-fns', 'lucide-react', '@vercel/analytics', '@vercel/speed-insights'],
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
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Output optimization
  output: 'standalone',
};

export default nextConfig;
