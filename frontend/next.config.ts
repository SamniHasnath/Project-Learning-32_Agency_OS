import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (node server.js).
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
