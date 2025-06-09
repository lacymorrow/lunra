"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Target, CheckCircle, Heart, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { useGoalData } from "@/contexts/goal-data-context"

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
    week: number
    task: string
    status: string
    progress: number
  }>
}

export default function Timeline() {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const { goals: userGoals, loading, error, dataManager, refreshGoals } = useGoalData()
  const [relatedGoals, setRelatedGoals] = useState<SavedGoal[]>([])

  // Add after the existing goal loading useEffect:
  useEffect(() => {
    if (selectedGoalId && userGoals && userGoals.length > 0) {
      const currentGoal = userGoals.find((goal) => goal.id === selectedGoalId)
      if (currentGoal) {
        // Find related goals (goals with similar descriptions or created around the same time)
        const related = userGoals.filter(
          (goal) =>
            goal.id !== selectedGoalId &&
            (goal.description.includes("Part of:") ||
              Math.abs(new Date(goal.createdAt).getTime() - new Date(currentGoal.createdAt).getTime()) < 300000), // Within 5 minutes
        )
        setRelatedGoals(related)
      }
    }
  }, [selectedGoalId, userGoals])

  // Scroll to top when page loads, especially when coming from goal creation
  useEffect(() => {
    // Force scroll to top immediately and after a short delay to ensure content is loaded
    window.scrollTo({ top: 0, behavior: "auto" })

    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 100)

    return () => clearTimeout(scrollTimeout)
  }, [])

  const markMilestoneComplete = async (goalId: number, milestoneIndex: number) => {
    try {
      await dataManager.markMilestoneComplete(goalId, milestoneIndex)
      await refreshGoals()
    } catch (error) {
      console.error("Error completing milestone:", error)
    }
  }

  const undoMilestoneComplete = async (goalId: number, milestoneIndex: number) => {
    try {
      await dataManager.undoMilestoneComplete(goalId, milestoneIndex)
      await refreshGoals()
    } catch (error) {
      console.error("Error undoing milestone:", error)
    }
  }

  // Fallback goals for demo purposes
  const fallbackGoals = {
    business: {
      title: "Launch my own business",
      timeline: "12 months",
      milestones: [
        { week: 1, task: "Market research & validation", status: "completed", progress: 100 },
        { week: 2, task: "Business plan development", status: "completed", progress: 100 },
        { week: 3, task: "Legal setup & registration", status: "in-progress", progress: 60 },
        { week: 4, task: "Brand identity & website", status: "pending", progress: 0 },
        { week: 5, task: "Product/service development", status: "pending", progress: 0 },
        { week: 6, task: "Initial funding secured", status: "pending", progress: 0 },
        { week: 8, task: "First customer acquisition", status: "pending", progress: 0 },
        { week: 10, task: "Team hiring", status: "pending", progress: 0 },
        { week: 12, task: "Official launch", status: "pending", progress: 0 },
      ],
    },
    fitness: {
      title: "Get in better shape",
      timeline: "6 months",
      milestones: [
        { week: 1, task: "Establish workout routine", status: "completed", progress: 100 },
        { week: 2, task: "Nutrition plan implementation", status: "completed", progress: 100 },
        { week: 3, task: "First fitness assessment", status: "completed", progress: 100 },
        { week: 4, task: "Increase workout intensity", status: "in-progress", progress: 75 },
        { week: 5, task: "Mid-point fitness test", status: "pending", progress: 0 },
        { week: 6, task: "Final fitness goals achieved", status: "pending", progress: 0 },
      ],
    },
  }

  // Simple progress visualization component
  const SimpleProgressChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-stone-500">
          <p>No progress data available</p>
        </div>
      )
    }

    return (
      <div className="h-[300px] flex items-end justify-between p-4 space-x-2">
        {data.map((item, index) => {
          const maxProgress = Math.max(
            ...data.map((d) =>
              Object.values(d)
                .filter((v) => typeof v === "number")
                .reduce((a: number, b: number) => Math.max(a, b), 0),
            ),
          )
          const progress = (Object.values(item).filter((v) => typeof v === "number")[0] as number) || 0
          const height = maxProgress > 0 ? (progress / maxProgress) * 200 : 0

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-rose-400 rounded-t-md transition-all duration-300"
                style={{ height: `${height}px`, minHeight: progress > 0 ? "4px" : "0px" }}
              />
              <div className="mt-2 text-xs text-stone-600 text-center">{item.week}</div>
              <div className="text-xs text-stone-500 text-center">{progress}%</div>
            </div>
          )
        })}
      </div>
    )
  }

  // Generate progress data from user goals
  const generateProgressData = () => {
    // If no user goals, return empty data
    if (!userGoals || userGoals.length === 0) {
      return [
        { week: "Week 1", progress: 0 },
        { week: "Week 2", progress: 0 },
        { week: "Week 3", progress: 0 },
        { week: "Week 4", progress: 0 },
      ]
    }

    // Get all unique weeks from all goals
    const allWeeks = new Set<number>()
    userGoals.forEach((goal) => {
      goal.milestones.forEach((milestone) => {
        allWeeks.add(milestone.week)
      })
    })

    // Sort weeks
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => a - b)

    // Create data points for each week
    return sortedWeeks.map((week) => {
      const dataPoint: Record<string, any> = { week: `Week ${week}` }

      // Add progress for each goal at this week
      userGoals.forEach((goal) => {
        // Create a safe key for the goal (no spaces or special chars)
        const goalKey = goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_")

        // Find the milestone for this week
        const milestone = goal.milestones.find((m) => m.week === week)

        if (milestone) {
          dataPoint[goalKey] = milestone.progress
        } else {
          // Find the most recent milestone before this week
          const previousMilestones = goal.milestones.filter((m) => m.week < week).sort((a, b) => b.week - a.week)

          if (previousMilestones.length > 0) {
            dataPoint[goalKey] = previousMilestones[0].progress
          } else {
            dataPoint[goalKey] = 0
          }
        }
      })

      return dataPoint
    })
  }

  // Get real progress data
  const progressData = generateProgressData()

  // Get current goal
  const currentGoal = userGoals?.find((goal) => goal.id === selectedGoalId)

  // Use fallback if no user goals
  const displayGoal = currentGoal || fallbackGoals.business

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage-500"
      case "in-progress":
        return "bg-amber-400"
      case "pending":
        return "bg-stone-300"
      default:
        return "bg-stone-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-sage-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "pending":
        return <Target className="h-4 w-4 text-stone-400" />
      default:
        return <Target className="h-4 w-4 text-stone-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400 mx-auto mb-4"></div>
            <p className="text-stone-600 font-light">Loading your timeline...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">Error loading timeline: {error.message}</p>
            <Button onClick={refreshGoals} className="bg-rose-400 hover:bg-rose-500 text-white rounded-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <DashboardHeader
          title="Your Journey Timeline"
          description="Visualize your path and celebrate milestones across all your goals."
        />

        {/* Goal Selector */}
        {userGoals && userGoals.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-4 flex-wrap">
              {userGoals.map((goal) => (
                <Button
                  key={goal.id}
                  variant={selectedGoalId === goal.id ? "default" : "outline"}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={
                    selectedGoalId === goal.id
                      ? "bg-rose-400 hover:bg-rose-500 text-white rounded-full"
                      : "border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full"
                  }
                >
                  {goal.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* No goals message */}
        {(!userGoals || userGoals.length === 0) && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="text-center">
              <Target className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-serif text-stone-800 mb-2">No goals created yet</h3>
              <p className="text-stone-600 font-light mb-4">
                Create your first goal to see your personalized timeline here.
              </p>
              <Link href="/create-goal">
                <Button className="bg-rose-400 hover:bg-rose-500 text-white rounded-full">
                  Create Your First Goal
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                  {displayGoal.title} Timeline
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {currentGoal ? currentGoal.timeline : displayGoal.timeline} plan with key milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(currentGoal ? currentGoal.milestones : displayGoal.milestones).map((milestone, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(milestone.status)}`}></div>
                        {index < (currentGoal ? currentGoal.milestones : displayGoal.milestones).length - 1 && (
                          <div className="w-0.5 h-12 bg-stone-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getStatusIcon(milestone.status)}
                            <span className="ml-2 font-medium text-stone-800">Week {milestone.week}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 ${
                                milestone.status === "completed"
                                  ? "bg-sage-50 text-sage-700 border-sage-200"
                                  : milestone.status === "in-progress"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-stone-50 text-stone-600 border-stone-200"
                              }`}
                            >
                              {milestone.progress}% complete
                            </Badge>
                            {/* Milestone Action Button */}
                            {currentGoal && (
                              <div>
                                {milestone.status === "completed" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => undoMilestoneComplete(currentGoal.id, index)}
                                    className="rounded-full border-sage-200 text-sage-700 hover:bg-sage-50"
                                  >
                                    Undo
                                  </Button>
                                ) : milestone.status === "in-progress" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => markMilestoneComplete(currentGoal.id, index)}
                                    className="rounded-full bg-sage-500 hover:bg-sage-600 text-white"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    className="rounded-full border-stone-200 text-stone-400"
                                  >
                                    Pending
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-stone-700 mb-2 font-light">{milestone.task}</p>
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(milestone.status)} transition-all duration-300`}
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">Progress Over Time</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Track your progress across all goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleProgressChart data={progressData} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-rose-400 to-amber-300 p-6 text-white">
                <div className="flex items-start">
                  <Heart className="h-6 w-6 mr-3 flex-shrink-0" />
                  <h3 className="font-serif text-xl">Current Focus</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="font-medium text-stone-800 mb-2">This Week</h4>
                    <p className="text-stone-700 text-sm font-light">
                      {(currentGoal ? currentGoal.milestones : displayGoal.milestones).find(
                        (m) => m.status === "in-progress",
                      )?.task || "No active tasks"}
                    </p>
                  </div>
                  <div className="p-4 bg-sage-50 rounded-xl border border-sage-100">
                    <h4 className="font-medium text-stone-800 mb-2">Completed</h4>
                    <p className="text-stone-700 text-sm font-light">
                      {
                        (currentGoal ? currentGoal.milestones : displayGoal.milestones).filter(
                          (m) => m.status === "completed",
                        ).length
                      }{" "}
                      of {(currentGoal ? currentGoal.milestones : displayGoal.milestones).length} milestones
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => {
                    if (currentGoal) {
                      const inProgressMilestone = currentGoal.milestones.findIndex((m) => m.status === "in-progress")
                      if (inProgressMilestone !== -1) {
                        markMilestoneComplete(currentGoal.id, inProgressMilestone)
                      }
                    }
                  }}
                  disabled={!currentGoal || !currentGoal.milestones.some((m) => m.status === "in-progress")}
                  className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-sage-500" />
                  Mark Current Milestone Complete
                </Button>
                <Button
                  onClick={() => {
                    if (currentGoal) {
                      dataManager.adjustTimeline(currentGoal.id)
                    }
                  }}
                  className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                  Adjust Timeline
                </Button>
                <Link href="/check-in" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2 text-rose-400" />
                    Weekly Check-in
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentGoal &&
                    currentGoal.milestones
                      .filter((m) => m.status !== "completed")
                      .slice(0, 2)
                      .map((milestone, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100"
                        >
                          <div>
                            <p className="font-medium text-stone-800 text-sm">{milestone.task}</p>
                            <p className="text-xs text-stone-600 font-light">{currentGoal.title}</p>
                          </div>
                          <Badge variant="outline" className="bg-white text-rose-600 border-rose-200 rounded-full">
                            Week {milestone.week}
                          </Badge>
                        </div>
                      ))}
                  {(!currentGoal || currentGoal.milestones.filter((m) => m.status !== "completed").length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-stone-500 text-sm font-light">All milestones completed! 🎉</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add this card in the sidebar after the "Upcoming Deadlines" card */}
            {relatedGoals.length > 0 && (
              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-stone-800">Related Timelines</CardTitle>
                  <CardDescription className="text-stone-600 font-light">Part of the same goal project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedGoals.map((goal) => (
                      <Button
                        key={goal.id}
                        variant="outline"
                        onClick={() => setSelectedGoalId(goal.id)}
                        className="w-full justify-start rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50 p-4 h-auto"
                      >
                        <div className="text-left">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <p className="text-xs text-stone-500 font-light">
                            {goal.progress}% complete • {goal.milestones.filter((m) => m.status === "completed").length}
                            /{goal.milestones.length}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
