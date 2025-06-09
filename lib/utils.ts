import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Follows Next.js 15 best practices for component styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to relative time (e.g., "2 days ago", "in 3 hours")
 * Optimized for Next.js 15 with proper internationalization support
 */
export function formatRelativeTime(date: Date, locale: string = 'en-US'): string {
  const now = new Date()
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000)
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  
  const intervals = [
    { unit: 'year' as const, seconds: 31536000 },
    { unit: 'month' as const, seconds: 2628000 },
    { unit: 'week' as const, seconds: 604800 },
    { unit: 'day' as const, seconds: 86400 },
    { unit: 'hour' as const, seconds: 3600 },
    { unit: 'minute' as const, seconds: 60 },
    { unit: 'second' as const, seconds: 1 },
  ]
  
  for (const { unit, seconds } of intervals) {
    const interval = Math.floor(Math.abs(diffInSeconds) / seconds)
    if (interval >= 1) {
      return rtf.format(diffInSeconds < 0 ? -interval : interval, unit)
    }
  }
  
  return rtf.format(0, 'second')
}

/**
 * Debounce function optimized for Next.js 15
 * Useful for search inputs, API calls, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 * Useful for scroll handlers, resize events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Sleep function for async operations
 * Useful for testing, animations, or API rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Safe JSON parsing with fallback
 * Prevents crashes from malformed JSON
 */
export function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value)
    return parsed !== null ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * Generate a random ID
 * Useful for keys, temporary IDs, etc.
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Format file size in human-readable format
 * Useful for file uploads, storage displays
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate email format
 * Simple but robust email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Capitalize first letter of each word
 * Useful for formatting names, titles
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Truncate text with ellipsis
 * Useful for card descriptions, previews
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Get initials from a name
 * Useful for avatar fallbacks
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format currency with proper locale support
 * Following Next.js 15 internationalization best practices
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Check if code is running on client side
 * Useful for Next.js 15 SSR/CSR checks
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if code is running on server side
 * Useful for Next.js 15 SSR/CSR checks
 */
export const isServer = !isClient
