import { SubscriptionManagement } from "@/components/billing/subscription-management";
import { SubscriptionOptions } from "@/components/billing/subscription-options";

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription and billing preferences
          </p>
        </div>

        <SubscriptionManagement />

        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            Available Plans
          </h2>
          <SubscriptionOptions />
        </div>
      </div>
    </div>
  );
}
