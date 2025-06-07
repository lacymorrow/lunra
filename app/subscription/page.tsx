"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { SubscriptionManager } from "@/components/subscription-manager"

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <DashboardHeader
            title="Subscription & Billing"
            description="Manage your plan, usage, and billing information"
            showBack
            backHref="/dashboard"
            backText="Dashboard"
          />
        </div>

        <SubscriptionManager />
      </div>
    </div>
  )
}