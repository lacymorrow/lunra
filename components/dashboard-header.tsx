import type React from "react"
import { ArrowLeft, Moon } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  title: string
  description?: string
  showBack?: boolean
  backHref?: string
  backText?: string
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  showBack,
  backHref,
  backText,
}) => {
  return (
  <div className="w-full">

  <Link
              href="/dashboard"
              className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-4 font-light"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
    <header className="my-3 rounded-lg border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Logo and Brand */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-300 to-amber-300 rounded-full flex items-center justify-center">
                <Moon className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-serif text-stone-800">lunra</span>
            </Link>

            {/* Back Navigation */}
            {showBack && backHref && (
              <div className="flex items-center space-x-2 text-stone-500">
                <span>/</span>
                <Link
                  href={backHref}
                  className="flex items-center space-x-2 text-stone-600 hover:text-stone-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-light">{backText}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Page Title */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-serif text-stone-800">{title}</h1>
            {description && <p className="text-stone-600 font-light text-sm mt-1">{description}</p>}
          </div>

          {/* Right side space for balance */}
          <div className="w-32"></div>
        </div>
      </div>
    </header>
    </div>
  )
}
