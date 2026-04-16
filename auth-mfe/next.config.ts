import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  assetPrefix: "/auth-static",
};

export default nextConfig;
