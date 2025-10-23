/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporary for deployment
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;