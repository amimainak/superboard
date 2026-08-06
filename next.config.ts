import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Allow external image domains for branding logos — restrict to known patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https' as const,
        hostname: '*.superboard.app',
      },
      {
        protocol: 'https' as const,
        hostname: 'superboard.app',
      },
    ],
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {},
  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      '@tldraw/tldraw',
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
  // Prevent server-only packages from leaking into client bundles
  serverExternalPackages: ['@prisma/client', 'stripe'],
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        // Strictest CSP for API routes — no scripts needed
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
