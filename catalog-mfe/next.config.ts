import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  assetPrefix: "/catalog-static",
};

export default nextConfig;
