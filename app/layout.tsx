import type React from "react"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout" // Changed from { ClientLayout } to ClientLayout
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Goal Planning App",
  description: "Plan and track your goals with ease",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
