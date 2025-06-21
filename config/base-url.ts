// Base URL configuration for the application
export const BASE_URL =
    process.env.NODE_ENV === 'production'
        ? 'https://lunra.ai'
        : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000'

export const SITE_URL = BASE_URL
