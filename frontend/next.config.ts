import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/menu',         destination: '/recipes',     permanent: false },
      { source: '/suppliers',    destination: '/ingredients', permanent: false },
      { source: '/tastings',     destination: '/rnd',         permanent: false },
      { source: '/design-system',destination: '/settings',    permanent: false },
      { source: '/admin/users',  destination: '/settings',    permanent: false },
      { source: '/outlets',      destination: '/settings',    permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ["@/lib/hooks", "lucide-react", "@tanstack/react-query"],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
