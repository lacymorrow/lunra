"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useGoalData } from "@/contexts/goal-data-context";
import { useLocalGoals } from "@/hooks/use-local-storage";
import {
  CheckCircle,
  Cloud,
  CloudOff,
  Database,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

export function OfflineDemo() {
  const { user, userProfile } = useAuth();
  const { dataManager, syncStatus, triggerManualSync } = useGoalData();
  const { goals: localGoals, addGoal, deleteGoal } = useLocalGoals();
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");

  const isPaidUser = user && userProfile?.plan_id === "bloom";

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    const goalData = {
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim() || "",
      timeline: "3 months",
      progress: 0,
      status: "not-started",
      dueDate: "",
      subGoals: [],
      completedSubGoals: 0,
      milestones: [],
    };

    // Always use data manager now (it handles localStorage + sync for paid users)
    dataManager.createGoal(goalData);

    setNewGoalTitle("");
    setNewGoalDescription("");
  };

  const handleDeleteGoal = (goalId: number) => {
    dataManager.deleteGoal(goalId);
  };

  const handleSync = async () => {
    if (isPaidUser) {
      try {
        await triggerManualSync();
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Offline-First Demo
              {isPaidUser ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-700"
                >
                  <Cloud className="h-3 w-3 mr-1" />
                  Cloud + Local
                </Badge>
              ) : user ? (
                <Badge variant="secondary">
                  <CloudOff className="h-3 w-3 mr-1" />
                  Local Only
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <CloudOff className="h-3 w-3 mr-1" />
                  Guest Mode
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isPaidUser
                ? "Your goals are stored locally for offline access and automatically synced to the cloud"
                : user
                ? "Your goals are stored locally on this device only. Upgrade to Bloom for cloud sync!"
                : "Your goals are stored locally. Sign in to sync them to the cloud!"}
            </CardDescription>
          </div>

          {isPaidUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncStatus.isLoading}
            >
              {syncStatus.isLoading ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-1" />
              )}
              Manual Sync
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add new goal form */}
        <div className="space-y-3 p-4 bg-stone-50 rounded-lg">
          <h4 className="font-medium text-sm">Add a New Goal</h4>
          <Input
            placeholder="Goal title..."
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGoal()}
          />
          <Textarea
            placeholder="Description (optional)..."
            value={newGoalDescription}
            onChange={(e) => setNewGoalDescription(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleAddGoal}
            disabled={!newGoalTitle.trim()}
            size="sm"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>

        {/* Goals list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Your Goals (
              {isPaidUser
                ? "Cloud + Local"
                : user
                ? "Local Only"
                : "Local Only"}
              )
            </h4>
            {localGoals.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {localGoals.length} goal{localGoals.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {localGoals.length === 0 ? (
            <div className="text-center py-8 text-stone-500">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No goals yet. Add one above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {localGoals.map((goal: any) => (
                <div
                  key={goal.id}
                  className="flex items-start justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{goal.title}</h5>
                    {goal.description && (
                      <p className="text-xs text-stone-600 mt-1">
                        {goal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {goal.timeline}
                      </Badge>
                      <span className="text-xs text-stone-500">
                        Created {new Date(goal.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync status */}
        {isPaidUser &&
          (syncStatus.result || syncStatus.bidirectionalResult) && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Sync Status</span>
              </div>
              <div className="text-xs text-stone-600 space-y-1">
                {syncStatus.result && (
                  <>
                    <p>
                      • Initial sync: {syncStatus.result.synced} goals synced to
                      cloud
                    </p>
                    <p>• {syncStatus.result.skipped} duplicates skipped</p>
                    {syncStatus.result.errors.length > 0 && (
                      <p className="text-rose-600">
                        • {syncStatus.result.errors.length} errors occurred
                      </p>
                    )}
                  </>
                )}
                {syncStatus.bidirectionalResult && (
                  <>
                    <p>
                      • ↗️ {syncStatus.bidirectionalResult.localToDbSynced}{" "}
                      local changes synced to cloud
                    </p>
                    <p>
                      • ↙️ {syncStatus.bidirectionalResult.dbToLocalSynced}{" "}
                      cloud changes synced locally
                    </p>
                    {syncStatus.bidirectionalResult.conflicts > 0 && (
                      <p>
                        • 🔀 {syncStatus.bidirectionalResult.conflicts}{" "}
                        conflicts resolved
                      </p>
                    )}
                    {syncStatus.bidirectionalResult.errors.length > 0 && (
                      <p className="text-rose-600">
                        • {syncStatus.bidirectionalResult.errors.length} sync
                        errors
                      </p>
                    )}
                  </>
                )}
                <p>• 💾 Local storage always preserved for offline access</p>
              </div>
            </div>
          )}

        {/* Instructions */}
        <div className="text-xs text-stone-500 p-3 bg-stone-50 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1">
            <li>
              • <strong>All users:</strong> Goals stored locally for instant
              offline access
            </li>
            <li>
              • <strong>Free plan (Seedling):</strong> Local storage only, works
              completely offline
            </li>
            <li>
              • <strong>Paid plan (Bloom):</strong> Local storage + automatic
              cloud sync
            </li>
            <li>
              • <strong>Cloud sync:</strong> Bidirectional sync keeps all
              devices in sync
            </li>
            <li>
              • <strong>Offline-first:</strong> Always works even without
              internet
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
