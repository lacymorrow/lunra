// Assuming a simple footer, if this file was previously empty or minimal.
// You can expand this as needed.
import Link from "next/link"
import { Moon } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-stone-200 pt-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-300 to-amber-300 rounded-full flex items-center justify-center">
              <Moon className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-serif text-stone-800">lunra</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/#features" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
              Features
            </Link>
            <Link href="/explore-process" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
              Our Process
            </Link>
            <Link href="/#pricing" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
              Pricing
            </Link>
            <Link href="/#testimonials" className="text-stone-600 hover:text-stone-800 transition-colors font-light">
              Stories
            </Link>
          </nav>
          <p className="text-stone-500 font-light text-sm">
            &copy; {new Date().getFullYear()} lunra. All rights reserved.
          </p>
        </div>
        <div className="text-center text-stone-400 font-light text-xs mt-8">
          Crafted with intention for mindful journeys.
        </div>
      </div>
    </footer>
  )
}
