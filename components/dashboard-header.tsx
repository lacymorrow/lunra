import type React from "react"
import { ArrowLeft } from "lucide-react"
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
    <div className="mb-12">
      {showBack && (
        <Link
          href={backHref || "/dashboard"}
          className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-4 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backText || "Back to Dashboard"}
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-3">{title}</h1>
          {description && <p className="text-stone-600 font-light">{description}</p>}
        </div>
      </div>
    </div>
  )
}
