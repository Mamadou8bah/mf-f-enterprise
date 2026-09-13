const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@garawol/db", "@garawol/shared"],
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: [],
  experimental: {
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/documents/settlement",
        destination: "/documents/collections",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
