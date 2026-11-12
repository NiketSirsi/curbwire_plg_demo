/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/og': ['./assets/fonts/**/*'],
    },
  },
};

module.exports = nextConfig;
