import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  assetPrefix: "/builds-static",
};

export default nextConfig;
