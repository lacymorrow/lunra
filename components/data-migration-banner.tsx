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
  CloudOff,
  Database,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function DataMigrationBanner() {
  const { user, userProfile } = useAuth();
  const { dataManager, refreshGoals, syncStatus } = useGoalData();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [localGoalsCount, setLocalGoalsCount] = useState(0);

  const isPaidUser = user && userProfile?.plan_id === "bloom";

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
    if (!isPaidUser) {
      toast({
        title: "Sync Not Available",
        description:
          "Cloud sync is available with the Bloom plan. Your goals remain safely stored locally.",
        variant: "default",
      });
      return;
    }

    try {
      const result = await dataManager.syncLocalGoalsToDatabase();
      await refreshGoals();

      if (result.synced > 0) {
        toast({
          title: "🎉 Initial Sync Successful!",
          description: `${result.synced} goal${
            result.synced > 1 ? "s" : ""
          } synced to the cloud. Local storage preserved for offline access.`,
        });
      } else if (result.skipped > 0) {
        toast({
          title: "Nothing to Sync",
          description: `All ${result.skipped} goal${
            result.skipped > 1 ? "s are" : " is"
          } already in the cloud. Local storage preserved.`,
        });
      }
    } catch (error) {
      console.error("Manual sync error:", error);
      toast({
        title: "Sync Failed",
        description:
          "Please try again or contact support. Your goals remain safe locally.",
        variant: "destructive",
      });
    }
  };

  // Show banner for different scenarios
  const shouldShow = user && localGoalsCount > 0 && isVisible;

  if (!shouldShow) {
    return null;
  }

  // Determine banner state based on user plan and sync status
  const getSyncStatusDisplay = () => {
    if (!isPaidUser) {
      return {
        icon: CloudOff,
        color: "bg-blue-50 border-blue-200",
        badgeVariant: "secondary" as const,
        badgeText: "Local Storage",
        title: "Goals Stored Locally",
        description: `You have ${localGoalsCount} goal${
          localGoalsCount > 1 ? "s" : ""
        } stored locally. Upgrade to Bloom for cloud sync and cross-device access.`,
        showUpgradeButton: true,
      };
    }

    if (syncStatus.isLoading) {
      return {
        icon: RefreshCw,
        color: "bg-blue-50 border-blue-200",
        badgeVariant: "default" as const,
        badgeText: "Syncing...",
        title: "Syncing Your Goals",
        description:
          "Setting up cloud sync for your goals. Local storage is preserved for offline access.",
        showUpgradeButton: false,
      };
    }

    if (syncStatus.result) {
      const { synced, skipped, errors } = syncStatus.result;

      if (errors.length > 0) {
        return {
          icon: AlertCircle,
          color: "bg-yellow-50 border-yellow-200",
          badgeVariant: "destructive" as const,
          badgeText: "Sync Issues",
          title: "Cloud Sync Completed with Issues",
          description: `${synced} synced, ${skipped} skipped, ${errors.length} failed. Local storage preserved for offline access.`,
          showUpgradeButton: false,
        };
      }

      return {
        icon: CheckCircle,
        color: "bg-green-50 border-green-200",
        badgeVariant: "default" as const,
        badgeText: "Cloud Sync Active",
        title: "Goals Synced to Cloud!",
        description: `${
          synced + skipped
        } goals available in cloud + local storage. Automatic sync is now active.`,
        showUpgradeButton: false,
      };
    }

    return {
      icon: Database,
      color: "bg-blue-50 border-blue-200",
      badgeVariant: "secondary" as const,
      badgeText: "Cloud Available",
      title: "Set Up Cloud Sync",
      description: `You have ${localGoalsCount} goal${
        localGoalsCount > 1 ? "s" : ""
      } stored locally. Sync them to the cloud for access across all devices.`,
      showUpgradeButton: false,
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
                    statusDisplay.badgeText === "Cloud Sync Active"
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

              <div className="flex gap-2">
                {statusDisplay.showUpgradeButton ? (
                  <Button
                    size="sm"
                    className="bg-rose-400 hover:bg-rose-500"
                    onClick={() => (window.location.href = "/billing")}
                  >
                    Upgrade to Bloom
                  </Button>
                ) : isPaidUser && !syncStatus.result ? (
                  <Button
                    size="sm"
                    onClick={handleManualSync}
                    disabled={syncStatus.isLoading}
                  >
                    <Database className="h-4 w-4 mr-1" />
                    Enable Cloud Sync
                  </Button>
                ) : null}

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
