"use client";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { DataMigrationBanner } from "@/components/data-migration-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { useGoalData } from "@/contexts/goal-data-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Calendar,
  CalendarIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Note: This is a client component so metadata is handled dynamically via layout.tsx
// For authenticated pages, we could add dynamic metadata based on user data

interface SavedGoal {
  id: number;
  title: string;
  description: string;
  timeline: string;
  progress: number;
  status: string;
  dueDate: string;
  subGoals: string[];
  completedSubGoals: number;
  createdAt: string;
  milestones: Array<{
    week: number;
    task: string;
    status: string;
    progress: number;
  }>;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    return start;
  });

  const { toast } = useToast();

  // Handle URL search params for success/error messages
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const warning = searchParams.get("warning");
    const canceled = searchParams.get("canceled");

    if (success === "subscription_created") {
      // Refresh the user profile to get the updated plan information
      refreshProfile();

      toast({
        title: "🎉 Welcome to Bloom!",
        description: "Your subscription is now active. Enjoy unlimited goals!",
      });
    } else if (error === "payment_failed") {
      toast({
        title: "Payment Failed",
        description: "Your payment couldn't be processed. Please try again.",
        variant: "destructive",
      });
    } else if (error === "processing_failed") {
      toast({
        title: "Processing Error",
        description:
          "Something went wrong. Please contact support if this continues.",
        variant: "destructive",
      });
    } else if (warning === "sync_needed") {
      // Also refresh profile when sync is needed
      refreshProfile();

      toast({
        title: "Sync Needed",
        description:
          "Your payment succeeded but we need to sync your account. Check billing page.",
      });
    } else if (canceled === "true") {
      toast({
        title: "Payment Canceled",
        description:
          "No worries! You can upgrade anytime from the billing page.",
      });
    }
  }, [searchParams, toast]); // Removed refreshProfile from dependencies

  // Sample calendar events (matching the calendar page)
  const [calendarEvents] = useState([
    {
      id: "1",
      title: "Complete market research",
      date: "2024-01-15",
      time: "09:00",
      type: "subgoal",
      color: "#FBBF24",
      completed: false,
    },
    {
      id: "2",
      title: "Doctor's Appointment",
      date: "2024-01-16",
      time: "14:30",
      type: "appointment",
      color: "#06B6D4",
      completed: false,
    },
    {
      id: "3",
      title: "Team Meeting",
      date: "2024-01-17",
      time: "10:00",
      type: "meeting",
      color: "#3B82F6",
      completed: false,
    },
    {
      id: "4",
      title: "Gym Session",
      date: "2024-01-17",
      time: "18:00",
      type: "health",
      color: "#10B981",
      completed: false,
    },
    {
      id: "5",
      title: "Coffee with Sarah",
      date: "2024-01-18",
      time: "15:00",
      type: "social",
      color: "#F59E0B",
      completed: false,
    },
  ]);

  const { goals, loading, error, dataManager, refreshGoals } = useGoalData();

  const markMilestoneComplete = async (
    goalId: number,
    milestoneIndex: number
  ) => {
    try {
      await dataManager.markMilestoneComplete(goalId, milestoneIndex);
      await refreshGoals(); // Refresh the goals after updating

      toast({
        title: "Milestone completed! 🎉",
        description: "Great progress on your goal!",
      });
    } catch (error) {
      console.error("Error completing milestone:", error);
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fallback sample goals for demo when no real goals exist
  const sampleGoals: SavedGoal[] = [
    {
      id: 999,
      title: "Launch my own business",
      description: "Start a tech company focused on productivity tools",
      timeline: "12 months",
      progress: 35,
      status: "in-progress",
      dueDate: "2024-12-31",
      subGoals: [
        "Market research & validation",
        "Business plan development",
        "Legal setup & registration",
        "Brand identity & website",
        "Product development",
        "Initial funding",
        "Customer acquisition",
        "Team hiring",
      ],
      completedSubGoals: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      milestones: [
        {
          week: 1,
          task: "Market research & validation",
          status: "completed",
          progress: 100,
        },
        {
          week: 2,
          task: "Business plan development",
          status: "completed",
          progress: 100,
        },
        {
          week: 3,
          task: "Legal setup & registration",
          status: "in-progress",
          progress: 60,
        },
      ],
    },
    {
      id: 998,
      title: "Get in better shape",
      description: "Improve overall fitness and health",
      timeline: "6 months",
      progress: 60,
      status: "on-track",
      dueDate: "2024-08-15",
      subGoals: [
        "Establish workout routine",
        "Nutrition plan implementation",
        "First fitness assessment",
        "Increase workout intensity",
        "Mid-point fitness test",
      ],
      completedSubGoals: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      milestones: [
        {
          week: 1,
          task: "Establish workout routine",
          status: "completed",
          progress: 100,
        },
        {
          week: 2,
          task: "Nutrition plan implementation",
          status: "completed",
          progress: 100,
        },
        {
          week: 3,
          task: "First fitness assessment",
          status: "completed",
          progress: 100,
        },
      ],
    },
    {
      id: 997,
      title: "Learn Spanish fluently",
      description: "Achieve conversational fluency in Spanish",
      timeline: "18 months",
      progress: 25,
      status: "behind",
      dueDate: "2025-06-01",
      subGoals: [
        "Complete beginner course",
        "Daily practice routine",
        "Conversation partner",
        "Intermediate course",
        "Travel to Spanish-speaking country",
        "Advanced course",
        "Fluency test",
      ],
      completedSubGoals: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      milestones: [
        {
          week: 1,
          task: "Complete beginner course",
          status: "completed",
          progress: 100,
        },
        {
          week: 2,
          task: "Daily practice routine",
          status: "completed",
          progress: 100,
        },
        {
          week: 3,
          task: "Conversation partner",
          status: "in-progress",
          progress: 40,
        },
      ],
    },
  ];

  // Use real goals if they exist, otherwise show sample goals
  const displayGoals = goals ? goals : sampleGoals;

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return calendarEvents.filter((event) => event.date === dateString);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const eventTypeIcons = {
    goal: "🎯",
    subgoal: "📋",
    milestone: "🏆",
    checkin: "✅",
    appointment: "🏥",
    meeting: "👥",
    personal: "💝",
    work: "💼",
    health: "💪",
    social: "🎉",
    travel: "✈️",
    reminder: "🔔",
  };

  const weekDays = getWeekDays(currentWeekStart);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-sage-500";
      case "behind":
        return "bg-rose-400";
      case "in-progress":
        return "bg-amber-400";
      case "completed":
        return "bg-sage-500";
      default:
        return "bg-stone-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "on-track":
        return "On Track";
      case "behind":
        return "Behind";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  // Group goals by status for better organization
  const groupRelatedGoals = (goals: SavedGoal[]) => {
    const grouped = {
      active: goals.filter(
        (goal) =>
          goal.status === "in-progress" ||
          goal.status === "on-track" ||
          goal.status === "behind"
      ),
      completed: goals.filter((goal) => goal.status === "completed"),
    };
    return grouped;
  };

  const groupedGoals = groupRelatedGoals(displayGoals);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#faf8f5" }}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mb-4"></div>
          <p className="text-stone-600 font-light">Loading your goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#faf8f5" }}
      >
        <div className="flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-rose-400 mb-4" />
          <p className="text-stone-600 font-light">
            Error loading goals:{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <DashboardPageHeader
        title="Dashboard"
        description="Track your progress and stay motivated on your journey"
      />
      <div className="container mx-auto px-6 py-8">
        <DataMigrationBanner />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Goals Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-serif text-stone-800">
                    Your Goals
                  </h2>
                  <p className="text-stone-600 font-light">
                    Track your progress and stay motivated
                  </p>
                </div>
                <Link href="/create-goal">
                  <Button className="rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Goal
                  </Button>
                </Link>
              </div>

              {groupedGoals.active.length === 0 ? (
                <Card className="border-0 rounded-3xl shadow-md">
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-stone-800 mb-2">
                      No active goals yet
                    </h3>
                    <p className="text-stone-600 font-light mb-6">
                      Start your journey by creating your first goal
                    </p>
                    <Link href="/create-goal">
                      <Button className="rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {groupedGoals.active.map((goal) => (
                    <Card
                      key={goal.id}
                      className="border-0 rounded-3xl shadow-md overflow-hidden"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl font-serif text-stone-800">
                                {goal.title}
                              </CardTitle>
                              <Badge
                                className={`${getStatusColor(
                                  goal.status
                                )} text-white border-0 rounded-full`}
                              >
                                {getStatusText(goal.status)}
                              </Badge>
                            </div>
                            <CardDescription className="text-stone-600 font-light">
                              {goal.description}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-serif text-rose-500">
                              {goal.progress}%
                            </div>
                            <div className="text-sm text-stone-500 font-light">
                              {goal.timeline}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-stone-600 mb-2">
                              <span>Progress</span>
                              <span>
                                {goal.completedSubGoals} of{" "}
                                {goal.subGoals.length} sub-goals
                              </span>
                            </div>
                            <Progress
                              value={goal.progress}
                              className="h-2 bg-stone-200"
                            />
                          </div>

                          {/* Current Milestones */}
                          {goal.milestones && goal.milestones.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-stone-700 mb-3">
                                Current Milestones
                              </h4>
                              <div className="space-y-2">
                                {goal.milestones
                                  .slice(0, 3)
                                  .map((milestone, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            milestone.status === "completed"
                                              ? "bg-sage-500"
                                              : milestone.status ===
                                                "in-progress"
                                              ? "bg-amber-400"
                                              : "bg-stone-300"
                                          }`}
                                        >
                                          {milestone.status === "completed" ? (
                                            <Check className="h-3 w-3 text-white" />
                                          ) : (
                                            <Clock className="h-3 w-3 text-white" />
                                          )}
                                        </div>
                                        <span className="text-sm text-stone-700">
                                          Week {milestone.week}:{" "}
                                          {milestone.task}
                                        </span>
                                      </div>
                                      {milestone.status !== "completed" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            markMilestoneComplete(
                                              goal.id,
                                              index
                                            )
                                          }
                                          className="text-sage-600 hover:text-sage-700 hover:bg-sage-50 rounded-full"
                                        >
                                          Mark Complete
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Link href={`/goal/${goal.id}`} className="flex-1">
                              <Button
                                variant="outline"
                                className="w-full rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
                              >
                                View Details
                              </Button>
                            </Link>
                            <Link href="/check-in" className="flex-1">
                              <Button className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                                Check In
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Goals Section */}
            {groupedGoals.completed.length > 0 && (
              <div>
                <h3 className="text-2xl font-serif text-stone-800 mb-4">
                  Completed Goals
                </h3>
                <div className="space-y-4">
                  {groupedGoals.completed.map((goal) => (
                    <Card
                      key={goal.id}
                      className="border-0 rounded-3xl shadow-md bg-sage-50"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-sage-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg text-stone-800">
                                {goal.title}
                              </h4>
                              <p className="text-sm text-stone-600 font-light">
                                Completed • {goal.timeline}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-sage-500 text-white border-0 rounded-full">
                            100%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Manage your goals and progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create-goal" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2 text-rose-400" />
                    Create New Goal
                  </Button>
                </Link>
                <Link href="/calendar" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-amber-400" />
                    Goal Calendar
                  </Button>
                </Link>
                <Link href="/check-in" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-sage-500" />
                    Weekly Check-in
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-serif text-stone-800">
                    This Week
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    Your upcoming events and goals
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("prev")}
                    className="rounded-full border-stone-200 h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("next")}
                    className="rounded-full border-stone-200 h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isToday =
                      new Date().toDateString() === day.toDateString();
                    const dayName = day.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const dayNumber = day.getDate();

                    return (
                      <div key={index} className="text-center">
                        <div
                          className={`text-xs font-medium mb-2 ${
                            isToday ? "text-rose-600" : "text-stone-600"
                          }`}
                        >
                          {dayName}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-3 mx-auto ${
                            isToday
                              ? "bg-rose-400 text-white"
                              : "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {dayNumber}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded text-white truncate"
                              style={{ backgroundColor: event.color }}
                              title={`${event.time ? event.time + " - " : ""}${
                                event.title
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                <span className="mr-1">
                                  {
                                    eventTypeIcons[
                                      event.type as keyof typeof eventTypeIcons
                                    ]
                                  }
                                </span>
                                <span className="truncate">
                                  {event.title.length > 8
                                    ? event.title.substring(0, 8) + "..."
                                    : event.title}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-stone-500">
                              +{dayEvents.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex gap-2">
                  <Link href="/calendar" className="flex-1">
                    <Button
                      className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                      variant="outline"
                      size="sm"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2 text-rose-400" />
                      View Full Calendar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-rose-400 to-amber-300 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl mb-1">Next Check-in</h3>
                    <p className="text-white/80 font-light text-sm">
                      Stay on track with regular reflections
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-serif text-rose-500 mb-2">
                    3 days
                  </div>
                  <p className="text-sm text-stone-600 font-light mb-4">
                    Until your next scheduled check-in
                  </p>
                  <Link href="/check-in">
                    <Button className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                      Start Early Check-in
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-amber-300 to-sage-300 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl mb-1">Daily Wisdom</h3>
                    <p className="text-white/80 font-light text-sm">
                      A gentle reminder for your journey
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <Heart className="h-8 w-8 text-rose-400" />
                  </div>
                  <p className="text-stone-700 italic font-light mb-2">
                    "Progress isn't always linear. Honor each step, no matter
                    how small."
                  </p>
                  <p className="text-sm text-stone-500 font-light">
                    — Your Goal Coach
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
