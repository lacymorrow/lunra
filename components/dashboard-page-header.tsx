"use client"

import type React from "react"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface DashboardPageHeaderProps {
  title: string
  description: string
  showBack?: boolean
  backHref?: string
  backText?: string
  children?: React.ReactNode
}

export function DashboardPageHeader({
  title,
  description,
  showBack = false,
  backHref = "/dashboard",
  backText = "Back to Dashboard",
  children,
}: DashboardPageHeaderProps) {
  return (
    <div className="mb-12">
      {showBack && (
        <Link href={backHref} className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-4 font-light">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backText}
        </Link>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-serif text-stone-800 mb-3">{title}</h1>
          <p className="text-stone-600 font-light">{description}</p>
        </div>
        {children && <div className="flex items-center space-x-4">{children}</div>}
      </div>
    </div>
  )
}
