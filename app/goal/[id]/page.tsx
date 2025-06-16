"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/dashboard-header";
import { useGoalData } from "@/contexts/goal-data-context";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Check,
  TrendingUp,
  Edit,
} from "lucide-react";
import Link from "next/link";
import type { SavedGoal } from "@/types";

export default function GoalDetail() {
  const params = useParams();
  const router = useRouter();
  const { goals, loading, error, refreshGoals } = useGoalData();
  const { toast } = useToast();
  const [goal, setGoal] = useState<SavedGoal | null>(null);

  const goalId = params.id as string;

  useEffect(() => {
    if (!loading && goals.length > 0) {
      const foundGoal = goals.find((g) => g.id.toString() === goalId);
      if (foundGoal) {
        setGoal(foundGoal);
      }
    }
  }, [goalId, goals, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage-500";
      case "on-track":
        return "bg-sage-500";
      case "in-progress":
        return "bg-amber-400";
      case "behind":
        return "bg-rose-400";
      default:
        return "bg-stone-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "on-track":
        return "On Track";
      case "in-progress":
        return "In Progress";
      case "behind":
        return "Behind Schedule";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mb-4"></div>
            <p className="text-stone-600 font-light">Loading goal details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-rose-400 mb-4" />
            <p className="text-stone-600 font-light mb-4">
              Error loading goal: {error.message}
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-rose-400 hover:bg-rose-500 text-white rounded-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-stone-400 mb-4" />
            <p className="text-stone-600 font-light mb-4">Goal not found</p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-rose-400 hover:bg-rose-500 text-white rounded-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="mb-4 rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <DashboardHeader
            title={goal.title}
            description={
              goal.description || "Track your progress and milestones"
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif text-stone-800">
                    Progress Overview
                  </CardTitle>
                  <Badge
                    className={`${getStatusColor(
                      goal.status
                    )} text-white border-0 rounded-full`}
                  >
                    {getStatusText(goal.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm text-stone-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress
                      value={goal.progress}
                      className="h-3 bg-stone-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-stone-50 rounded-2xl">
                      <div className="text-2xl font-serif text-stone-800">
                        {goal.completedSubGoals}
                      </div>
                      <div className="text-sm text-stone-600 font-light">
                        Completed Tasks
                      </div>
                    </div>
                    <div className="text-center p-4 bg-stone-50 rounded-2xl">
                      <div className="text-2xl font-serif text-stone-800">
                        {goal.subGoals.length - goal.completedSubGoals}
                      </div>
                      <div className="text-sm text-stone-600 font-light">
                        Remaining Tasks
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Timeline */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                  Milestones Timeline
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Track your key milestones and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goal.milestones && goal.milestones.length > 0 ? (
                    goal.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              milestone.status === "completed"
                                ? "bg-sage-500"
                                : milestone.status === "in-progress"
                                ? "bg-amber-400"
                                : "bg-stone-300"
                            }`}
                          >
                            {milestone.status === "completed" ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Clock className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">
                              Week {milestone.week}
                            </p>
                            <p className="text-sm text-stone-600 font-light">
                              {milestone.task}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-stone-800">
                            {milestone.progress}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                      <p className="text-stone-500 font-light">
                        No milestones created yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sub-Goals */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Target className="h-5 w-5 mr-2 text-sage-500" />
                  Action Items
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Your personalized sub-goals and tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {goal.subGoals && goal.subGoals.length > 0 ? (
                    goal.subGoals.map((subGoal, index) => (
                      <div
                        key={index}
                        className={`flex items-start p-4 border border-stone-200 rounded-xl ${
                          index < goal.completedSubGoals
                            ? "bg-sage-50 border-sage-200"
                            : "bg-white hover:shadow-sm"
                        } transition-shadow`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-4 flex-shrink-0 ${
                            index < goal.completedSubGoals
                              ? "bg-sage-500 text-white"
                              : "bg-gradient-to-br from-rose-400 to-amber-300 text-white"
                          }`}
                        >
                          {index < goal.completedSubGoals ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <p
                          className={`flex-1 ${
                            index < goal.completedSubGoals
                              ? "text-sage-800 line-through"
                              : "text-stone-700"
                          } font-light`}
                        >
                          {subGoal}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                      <p className="text-stone-500 font-light">
                        No sub-goals defined yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Details */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">
                  Goal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-stone-500 font-light mb-1">
                      Timeline
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 rounded-full"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {goal.timeline}
                    </Badge>
                  </div>

                  {goal.dueDate && (
                    <div>
                      <p className="text-sm text-stone-500 font-light mb-1">
                        Due Date
                      </p>
                      <p className="text-stone-700">
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-stone-500 font-light mb-1">
                      Created
                    </p>
                    <p className="text-stone-700">
                      {new Date(goal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/check-in" className="block">
                    <Button className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Check In Progress
                    </Button>
                  </Link>

                  <Link href={`/timeline?goalId=${goal.id}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Timeline
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
