import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow external image domains for branding logos
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: '**',
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
};

export default nextConfig;
