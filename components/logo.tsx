import Link from "next/link"
import { Moon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  href?: string
  className?: string
  showText?: boolean
  variant?: "default" | "white" | "gradient"
  interactive?: boolean
}

export function Logo({
  size = "md",
  href,
  className,
  showText = true,
  variant = "default",
  interactive = true,
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "w-6 h-6",
      iconInner: "h-3 w-3",
      text: "text-lg",
      spacing: "space-x-2",
    },
    md: {
      icon: "w-8 h-8",
      iconInner: "h-4 w-4",
      text: "text-xl",
      spacing: "space-x-3",
    },
    lg: {
      icon: "w-10 h-10",
      iconInner: "h-5 w-5",
      text: "text-2xl",
      spacing: "space-x-3",
    },
    xl: {
      icon: "w-12 h-12",
      iconInner: "h-6 w-6",
      text: "text-3xl",
      spacing: "space-x-4",
    },
  }

  const variantClasses = {
    default: {
      text: "text-stone-800",
      iconBg: "bg-gradient-to-br from-rose-400 to-amber-400",
    },
    white: {
      text: "text-white",
      iconBg: "bg-gradient-to-br from-rose-400 to-amber-400",
    },
    gradient: {
      text: "bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent",
      iconBg: "bg-gradient-to-br from-rose-400 to-amber-400",
    },
  }

  const LogoContent = () => (
    <div
      className={cn(
        "flex items-center",
        sizeClasses[size].spacing,
        interactive && "transition-all duration-200 hover:scale-105",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center shadow-sm",
          sizeClasses[size].icon,
          variantClasses[variant].iconBg,
        )}
      >
        <Moon className={cn("text-white", sizeClasses[size].iconInner)} />
      </div>
      {showText && (
        <span className={cn("font-serif font-medium", sizeClasses[size].text, variantClasses[variant].text)}>
          lunra
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
