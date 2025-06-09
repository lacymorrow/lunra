/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features that are stable in Next.js 15
  experimental: {
    // Enable React 19 features
    ppr: false, // Partial Prerendering - set to true when ready for your use case
  },
  
  // Production-ready settings
  eslint: {
    // Remove ignoreDuringBuilds for production - enable linting
    dirs: ['app', 'lib', 'components', 'contexts', 'hooks'],
  },
  
  typescript: {
    // Remove ignoreBuildErrors for production - enable type checking
    tsconfigPath: './tsconfig.json',
  },
  
  // Image optimization settings
  images: {
    // Remove unoptimized for production
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
