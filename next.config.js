/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Remove deprecated appDir config
    serverComponentsExternalPackages: ['prisma']
  },
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Reduce bundle size by aliasing heavy libs
      }
      return config
    }
  })
}

module.exports = nextConfig