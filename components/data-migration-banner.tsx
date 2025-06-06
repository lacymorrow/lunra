"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Database, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useGoalData } from "@/contexts/goal-data-context"
import { useToast } from "@/hooks/use-toast"

export function DataMigrationBanner() {
  const { user } = useAuth()
  const { dataManager, refreshGoals } = useGoalData()
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)

  // Only show if user is logged in and has localStorage goals
  const hasLocalStorageGoals = () => {
    try {
      const localGoals = localStorage.getItem("userGoals")
      return localGoals && JSON.parse(localGoals).length > 0
    } catch {
      return false
    }
  }

  const handleMigration = async () => {
    setIsMigrating(true)
    try {
      await dataManager.syncLocalGoalsToDatabase()
      await refreshGoals()

      toast({
        title: "Migration successful! 🎉",
        description: "Your goals have been synced to your account",
      })

      setIsVisible(false)
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
        description: "Please try again or contact support",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (!user || !hasLocalStorageGoals() || !isVisible) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Sync Your Goals</h3>
              <p className="text-sm text-amber-700 mt-1">
                We found goals stored locally on your device. Sync them to your account to access them anywhere and
                enable real-time features.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleMigration}
              disabled={isMigrating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                "Sync Now"
              )}
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:text-amber-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
