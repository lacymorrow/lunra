"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Heart,
  Sparkles,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"

interface SavedGoal {
  id: number
  title: string
  description: string
  timeline: string
  progress: number
  status: string
  dueDate: string
  subGoals: string[]
  completedSubGoals: number
  createdAt: string
  milestones: Array<{
    month: number
    task: string
    status: string
    progress: number
  }>
}

export default function Dashboard() {
  const [goals, setGoals] = useState<SavedGoal[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const start = new Date(today)
    start.setDate(today.getDate() - dayOfWeek)
    return start
  })

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
  ])

  // Function to mark milestone as complete
  const markMilestoneComplete = (goalId: number, milestoneIndex: number) => {
    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        const updatedMilestones = [...goal.milestones]
        const milestone = updatedMilestones[milestoneIndex]

        if (milestone.status !== "completed") {
          // Mark as completed
          updatedMilestones[milestoneIndex] = {
            ...milestone,
            status: "completed",
            progress: 100,
          }

          // Update next milestone to in-progress if it exists
          if (milestoneIndex + 1 < updatedMilestones.length) {
            const nextMilestone = updatedMilestones[milestoneIndex + 1]
            if (nextMilestone.status === "pending") {
              updatedMilestones[milestoneIndex + 1] = {
                ...nextMilestone,
                status: "in-progress",
                progress: 10,
              }
            }
          }

          // Calculate new overall progress
          const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
          const newProgress = Math.round((completedMilestones / updatedMilestones.length) * 100)

          // Update goal status based on progress
          let newStatus = goal.status
          if (newProgress === 100) {
            newStatus = "completed"
          } else if (newProgress > 50) {
            newStatus = "on-track"
          } else {
            newStatus = "in-progress"
          }

          return {
            ...goal,
            milestones: updatedMilestones,
            progress: newProgress,
            completedSubGoals: completedMilestones,
            status: newStatus,
          }
        }
      }
      return goal
    })

    setGoals(updatedGoals)
    localStorage.setItem("userGoals", JSON.stringify(updatedGoals))
  }

  // Load goals from localStorage on component mount
  useEffect(() => {
    const loadGoals = () => {
      try {
        const storedGoals = localStorage.getItem("userGoals")
        if (storedGoals) {
          const parsedGoals: SavedGoal[] = JSON.parse(storedGoals)
          console.log("Loaded goals from localStorage:", parsedGoals)
          setGoals(parsedGoals)
        } else {
          console.log("No goals found in localStorage")
          // Set empty array if no goals exist
          setGoals([])
        }
      } catch (error) {
        console.error("Error loading goals from localStorage:", error)
        setGoals([])
      }
    }

    loadGoals()

    // Listen for storage changes (in case goals are updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userGoals") {
        loadGoals()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

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
        { month: 1, task: "Market research & validation", status: "completed", progress: 100 },
        { month: 2, task: "Business plan development", status: "completed", progress: 100 },
        { month: 3, task: "Legal setup & registration", status: "in-progress", progress: 60 },
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
        { month: 1, task: "Establish workout routine", status: "completed", progress: 100 },
        { month: 2, task: "Nutrition plan implementation", status: "completed", progress: 100 },
        { month: 3, task: "First fitness assessment", status: "completed", progress: 100 },
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
        { month: 1, task: "Complete beginner course", status: "completed", progress: 100 },
        { month: 2, task: "Daily practice routine", status: "completed", progress: 100 },
        { month: 3, task: "Conversation partner", status: "in-progress", progress: 40 },
      ],
    },
  ]

  // Use real goals if they exist, otherwise show sample goals
  const displayGoals = goals.length > 0 ? goals : sampleGoals

  const getWeekDays = (startDate: Date) => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return calendarEvents.filter((event) => event.date === dateString)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

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
  }

  const weekDays = getWeekDays(currentWeekStart)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-sage-500"
      case "behind":
        return "bg-rose-400"
      case "in-progress":
        return "bg-amber-400"
      case "completed":
        return "bg-sage-500"
      default:
        return "bg-stone-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "on-track":
        return "On Track"
      case "behind":
        return "Needs Attention"
      case "in-progress":
        return "In Progress"
      case "completed":
        return "Completed"
      default:
        return "Unknown"
    }
  }

  // Calculate stats from actual goals
  const totalCompletedSteps = displayGoals.reduce((acc, goal) => acc + goal.completedSubGoals, 0)
  const averageProgress =
    displayGoals.length > 0
      ? Math.round(displayGoals.reduce((acc, goal) => acc + goal.progress, 0) / displayGoals.length)
      : 0
  const dueThisMonth = displayGoals.filter((goal) => {
    const dueDate = new Date(goal.dueDate)
    const now = new Date()
    return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif text-stone-800 mb-3">Your Journey Dashboard</h1>
          <p className="text-stone-600 font-light">
            Track your goals, visualize progress, and stay motivated on your path.
          </p>
          {goals.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm">
                <strong>Demo Mode:</strong> You're seeing sample goals. Create your first goal to see your real progress
                here!
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-rose-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Active Goals</p>
                  <p className="text-2xl font-serif text-stone-800">{displayGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-sage-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Completed Steps</p>
                  <p className="text-2xl font-serif text-stone-800">{totalCompletedSteps}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Avg Progress</p>
                  <p className="text-2xl font-serif text-stone-800">{averageProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-stone-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Due This Month</p>
                  <p className="text-2xl font-serif text-stone-800">{dueThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goals Overview */}
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-serif text-stone-800">Your Goals</CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    Track progress on your life goals
                  </CardDescription>
                </div>
                <Link href="/create-goal">
                  <Button className="bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                    <Plus className="h-4 w-4 mr-2" />
                    New Goal
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {displayGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-stone-800 mb-2">No goals yet</h3>
                    <p className="text-stone-600 font-light mb-6">
                      Create your first goal to start tracking your progress and building momentum.
                    </p>
                    <Link href="/create-goal">
                      <Button className="bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {displayGoals.map((goal) => {
                      const currentMilestone = goal.milestones.find((m) => m.status !== "completed")
                      const currentMilestoneIndex = goal.milestones.findIndex((m) => m.status !== "completed")

                      return (
                        <div
                          key={goal.id}
                          className="border border-stone-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-serif text-xl text-stone-800 mb-1">{goal.title}</h3>
                              <p className="text-sm text-stone-600 font-light">
                                {goal.completedSubGoals} of {goal.subGoals.length} steps completed
                              </p>
                              {goal.description && (
                                <p className="text-sm text-stone-500 font-light mt-1">{goal.description}</p>
                              )}
                              {currentMilestone && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-amber-600 font-medium">Current:</span>
                                  <span className="text-xs text-stone-700">{currentMilestone.task}</span>
                                  {goals.length > 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => markMilestoneComplete(goal.id, currentMilestoneIndex)}
                                      className="ml-2 h-6 px-2 text-xs rounded-full bg-sage-500 hover:bg-sage-600 text-white"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Complete
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                            <Badge className={`${getStatusColor(goal.status)} text-white font-light rounded-full px-3`}>
                              {getStatusText(goal.status)}
                            </Badge>
                          </div>

                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-stone-600 font-light">Progress</span>
                              <span className="text-stone-800">{goal.progress}%</span>
                            </div>
                            <Progress
                              value={goal.progress}
                              className="h-2 bg-stone-100"
                              style={
                                {
                                  "--progress-background":
                                    goal.status === "on-track" || goal.status === "completed"
                                      ? "#8EB69B"
                                      : goal.status === "behind"
                                        ? "#F87171"
                                        : "#FBBF24",
                                } as React.CSSProperties
                              }
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-stone-500 font-light">
                              Due: {new Date(goal.dueDate).toLocaleDateString()}
                            </span>
                            <div className="space-x-2">
                              <Link href={`/goal/${goal.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-stone-200 text-stone-700"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/timeline?goalId=${goal.id}`}>
                                <Button size="sm" className="rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                                  View Timeline
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">Quick Actions</CardTitle>
                <CardDescription className="text-stone-600 font-light">Get started with your planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create-goal" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2 text-rose-400" />
                    Create New Goal
                  </Button>
                </Link>
                <Link href="/timeline" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2 text-amber-400" />
                    View Timeline
                  </Button>
                </Link>
                <Link href="/calendar" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 text-sage-500" />
                    Calendar
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
                <Link href="/analytics" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-2 text-stone-500" />
                    Progress Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-serif text-stone-800">This Week</CardTitle>
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
                    const dayEvents = getEventsForDate(day)
                    const isToday = new Date().toDateString() === day.toDateString()
                    const dayName = day.toLocaleDateString("en-US", { weekday: "short" })
                    const dayNumber = day.getDate()

                    return (
                      <div key={index} className="text-center">
                        <div className={`text-xs font-medium mb-2 ${isToday ? "text-rose-600" : "text-stone-600"}`}>
                          {dayName}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-3 mx-auto ${
                            isToday ? "bg-rose-400 text-white" : "bg-stone-100 text-stone-700"
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
                              title={`${event.time ? event.time + " - " : ""}${event.title}`}
                            >
                              <div className="flex items-center justify-center">
                                <span className="mr-1">
                                  {eventTypeIcons[event.type as keyof typeof eventTypeIcons]}
                                </span>
                                <span className="truncate">
                                  {event.title.length > 8 ? event.title.substring(0, 8) + "..." : event.title}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-stone-500">+{dayEvents.length - 3}</div>
                          )}
                        </div>
                      </div>
                    )
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
                    <p className="text-white/80 font-light text-sm">Stay on track with regular reflections</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-serif text-rose-500 mb-2">3 days</div>
                  <p className="text-sm text-stone-600 font-light mb-4">Until your next scheduled check-in</p>
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
                    <p className="text-white/80 font-light text-sm">A gentle reminder for your journey</p>
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
                    "Progress isn't always linear. Honor each step, no matter how small."
                  </p>
                  <p className="text-sm text-stone-500 font-light">— Your Goal Coach</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
