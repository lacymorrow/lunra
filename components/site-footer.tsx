import Link from "next/link"
import { Moon, Users, MessageCircle } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="bg-stone-800 text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center">
                <Moon className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-serif">lunra</span>
            </div>
            <p className="text-stone-400 mb-6 font-light leading-relaxed">
              Mindful goal planning that honors your journey and celebrates every step toward your dreams.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center hover:bg-stone-600 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center hover:bg-stone-600 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center hover:bg-stone-600 transition-colors">
                <Moon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Experience</h3>
            <ul className="space-y-3 text-stone-400 font-light">
              <li>
                <Link href="/#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Mobile App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Integrations
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Community</h3>
            <ul className="space-y-3 text-stone-400 font-light">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Join Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Connect
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-serif text-lg mb-6">Support</h3>
            <ul className="space-y-3 text-stone-400 font-light">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-700 mt-16 pt-10 text-center text-stone-400 font-light">
          <p>&copy; 2025 lunra. crafted with care for dreamers everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
