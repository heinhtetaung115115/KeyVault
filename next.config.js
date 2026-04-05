/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "graph.digiseller.ru",
      },
      {
        protocol: "https",
        hostname: "graph.digiseller.com",
      },
    ],
  },
};

module.exports = nextConfig;
