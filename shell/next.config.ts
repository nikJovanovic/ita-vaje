import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    const catalog = process.env.CATALOG_URL ?? "http://localhost:3001";
    const builds = process.env.BUILDS_URL ?? "http://localhost:3002";
    const auth = process.env.AUTH_URL ?? "http://localhost:3003";
    return [
      { source: "/catalog", destination: `${catalog}/catalog` },
      { source: "/catalog/:path+", destination: `${catalog}/catalog/:path+` },
      {
        source: "/catalog-static/_next/:path+",
        destination: `${catalog}/catalog-static/_next/:path+`,
      },
      { source: "/builds", destination: `${builds}/builds` },
      { source: "/builds/:path+", destination: `${builds}/builds/:path+` },
      {
        source: "/builds-static/_next/:path+",
        destination: `${builds}/builds-static/_next/:path+`,
      },
      { source: "/auth", destination: `${auth}/auth` },
      { source: "/auth/:path+", destination: `${auth}/auth/:path+` },
      {
        source: "/auth-static/_next/:path+",
        destination: `${auth}/auth-static/_next/:path+`,
      },
    ];
  },
};

export default nextConfig;
