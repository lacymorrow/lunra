"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useGoalData } from "@/contexts/goal-data-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  CheckCircle,
  Database,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DataMigrationBanner() {
  const { user } = useAuth();
  const { dataManager, refreshGoals, syncStatus } = useGoalData();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [localGoalsCount, setLocalGoalsCount] = useState(0);

  // Check for localStorage goals and update count
  useEffect(() => {
    const checkLocalGoals = () => {
      try {
        const savedGoals = localStorage.getItem("savedGoals");
        const count = savedGoals ? JSON.parse(savedGoals).length : 0;
        setLocalGoalsCount(count);
        return count > 0;
      } catch {
        setLocalGoalsCount(0);
        return false;
      }
    };

    // Check periodically in case goals are added/removed
    const interval = setInterval(checkLocalGoals, 2000);
    checkLocalGoals();

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    try {
      const result = await dataManager.syncLocalGoalsToDatabase();
      await refreshGoals();

      if (result.synced > 0) {
        toast({
          title: "🎉 Manual Sync Successful!",
          description: `${result.synced} goal${
            result.synced > 1 ? "s" : ""
          } synced to your account.`,
        });
      } else if (result.skipped > 0) {
        toast({
          title: "Nothing to Sync",
          description: `All ${result.skipped} goal${
            result.skipped > 1 ? "s are" : " is"
          } already in your account.`,
        });
      }

      if (result.clearedLocal) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error("Manual sync error:", error);
      toast({
        title: "Sync Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    }
  };

  // Show banner if:
  // 1. User is logged in
  // 2. Has local storage goals
  // 3. Banner is still visible
  // 4. Not currently syncing automatically
  const shouldShow =
    user && localGoalsCount > 0 && isVisible && !syncStatus.isLoading;

  if (!shouldShow) {
    return null;
  }

  // Determine banner state based on sync status
  const getSyncStatusDisplay = () => {
    if (syncStatus.isLoading) {
      return {
        icon: RefreshCw,
        color: "bg-blue-50 border-blue-200",
        badgeVariant: "default" as const,
        badgeText: "Syncing...",
        title: "Syncing Your Goals",
        description:
          "Please wait while we transfer your goals to your account...",
      };
    }

    if (syncStatus.result) {
      const { synced, skipped, errors, clearedLocal } = syncStatus.result;

      if (errors.length > 0) {
        return {
          icon: AlertCircle,
          color: "bg-yellow-50 border-yellow-200",
          badgeVariant: "destructive" as const,
          badgeText: "Sync Issues",
          title: "Sync Completed with Issues",
          description: `${synced} synced, ${skipped} skipped, ${
            errors.length
          } failed. Local data ${clearedLocal ? "cleared" : "preserved"}.`,
        };
      }

      if (clearedLocal) {
        return {
          icon: CheckCircle,
          color: "bg-green-50 border-green-200",
          badgeVariant: "default" as const,
          badgeText: "Sync Complete",
          title: "Goals Successfully Synced!",
          description: `${synced} goals transferred to your account. Local storage cleared.`,
        };
      }
    }

    return {
      icon: Database,
      color: "bg-blue-50 border-blue-200",
      badgeVariant: "secondary" as const,
      badgeText: "Action Needed",
      title: "Sync Your Local Goals",
      description: `You have ${localGoalsCount} goal${
        localGoalsCount > 1 ? "s" : ""
      } saved locally. Sync them to your account to access them anywhere.`,
    };
  };

  const statusDisplay = getSyncStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <Card className={`mb-6 ${statusDisplay.color}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <StatusIcon
              className={`h-5 w-5 mt-0.5 ${
                syncStatus.isLoading ? "animate-spin" : ""
              } ${
                statusDisplay.badgeVariant === "destructive"
                  ? "text-yellow-600"
                  : statusDisplay.badgeVariant === "default" &&
                    statusDisplay.badgeText === "Sync Complete"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-sm">{statusDisplay.title}</h3>
                <Badge variant={statusDisplay.badgeVariant} className="text-xs">
                  {statusDisplay.badgeText}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {statusDisplay.description}
              </p>

              {!syncStatus.isLoading && !syncStatus.result?.clearedLocal && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleManualSync}
                    disabled={syncStatus.isLoading}
                  >
                    <Database className="h-4 w-4 mr-1" />
                    Sync Now
                  </Button>

                  {syncStatus.result?.errors &&
                    syncStatus.result.errors.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Sync Errors",
                            description: syncStatus.result!.errors.join("; "),
                            variant: "destructive",
                          });
                        }}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        View Errors
                      </Button>
                    )}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
