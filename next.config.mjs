/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
		compiler: {
		// Todo: Remove console logs only in production, excluding error logs
		// removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
		},
		async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
          //     "style-src 'self' 'unsafe-inline'",
          //     "img-src 'self' data: https:",
          //     "font-src 'self' data:",
          //     "connect-src 'self' https://*.supabase.co https://api.stripe.com",
          //     "frame-src https://js.stripe.com",
          //     "object-src 'none'",
          //     "base-uri 'self'",
          //     "form-action 'self'",
          //     "frame-ancestors 'none'",
          //     "upgrade-insecure-requests"
          //   ].join('; ')
          // }
        ]
      }
    ]
  }
}

export default nextConfig
