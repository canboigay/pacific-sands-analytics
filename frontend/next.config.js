/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@pacific/formula-engine': path.resolve(__dirname, 'packages/@pacific/formula-engine/src'),
      '@pacific/rules-engine': path.resolve(__dirname, 'packages/@pacific/rules-engine/src'),
    }
    return config
  },
}

module.exports = nextConfig
