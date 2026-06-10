import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  eslint: {
    ignoreDuringBuilds: false
  }
};

export default nextConfig;
