"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Target, CheckCircle, Heart, Check } from "lucide-react"
import Link from "next/link"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts"
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

export default function Timeline() {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null)
  const [userGoals, setUserGoals] = useState<SavedGoal[]>([])

  // Load goals from localStorage
  useEffect(() => {
    const storedGoals = localStorage.getItem("userGoals")
    const currentGoalId = localStorage.getItem("currentGoalId")

    if (storedGoals) {
      const goals: SavedGoal[] = JSON.parse(storedGoals)
      setUserGoals(goals)

      // Set the selected goal to the most recent one or the current one
      if (currentGoalId) {
        setSelectedGoalId(Number.parseInt(currentGoalId))
      } else if (goals.length > 0) {
        setSelectedGoalId(goals[goals.length - 1].id)
      }
    }
  }, [])

  // Function to mark milestone as complete
  const markMilestoneComplete = (goalId: number, milestoneIndex: number) => {
    const updatedGoals = userGoals.map((goal) => {
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

    setUserGoals(updatedGoals)
    localStorage.setItem("userGoals", JSON.stringify(updatedGoals))
  }

  // Function to undo milestone completion
  const undoMilestoneComplete = (goalId: number, milestoneIndex: number) => {
    const updatedGoals = userGoals.map((goal) => {
      if (goal.id === goalId) {
        const updatedMilestones = [...goal.milestones]
        const milestone = updatedMilestones[milestoneIndex]

        if (milestone.status === "completed") {
          // Mark as in-progress
          updatedMilestones[milestoneIndex] = {
            ...milestone,
            status: "in-progress",
            progress: 50,
          }

          // Update next milestone back to pending if it was auto-started
          if (milestoneIndex + 1 < updatedMilestones.length) {
            const nextMilestone = updatedMilestones[milestoneIndex + 1]
            if (nextMilestone.status === "in-progress" && nextMilestone.progress === 10) {
              updatedMilestones[milestoneIndex + 1] = {
                ...nextMilestone,
                status: "pending",
                progress: 0,
              }
            }
          }

          // Calculate new overall progress
          const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
          const newProgress = Math.round((completedMilestones / updatedMilestones.length) * 100)

          return {
            ...goal,
            milestones: updatedMilestones,
            progress: newProgress,
            completedSubGoals: completedMilestones,
            status: "in-progress",
          }
        }
      }
      return goal
    })

    setUserGoals(updatedGoals)
    localStorage.setItem("userGoals", JSON.stringify(updatedGoals))
  }

  // Fallback goals for demo purposes
  const fallbackGoals = {
    business: {
      title: "Launch my own business",
      timeline: "12 months",
      milestones: [
        { month: 1, task: "Market research & validation", status: "completed", progress: 100 },
        { month: 2, task: "Business plan development", status: "completed", progress: 100 },
        { month: 3, task: "Legal setup & registration", status: "in-progress", progress: 60 },
        { month: 4, task: "Brand identity & website", status: "pending", progress: 0 },
        { month: 5, task: "Product/service development", status: "pending", progress: 0 },
        { month: 6, task: "Initial funding secured", status: "pending", progress: 0 },
        { month: 8, task: "First customer acquisition", status: "pending", progress: 0 },
        { month: 10, task: "Team hiring", status: "pending", progress: 0 },
        { month: 12, task: "Official launch", status: "pending", progress: 0 },
      ],
    },
    fitness: {
      title: "Get in better shape",
      timeline: "6 months",
      milestones: [
        { month: 1, task: "Establish workout routine", status: "completed", progress: 100 },
        { month: 2, task: "Nutrition plan implementation", status: "completed", progress: 100 },
        { month: 3, task: "First fitness assessment", status: "completed", progress: 100 },
        { month: 4, task: "Increase workout intensity", status: "in-progress", progress: 75 },
        { month: 5, task: "Mid-point fitness test", status: "pending", progress: 0 },
        { month: 6, task: "Final fitness goals achieved", status: "pending", progress: 0 },
      ],
    },
  }

  const progressData = [
    { month: "Jan", business: 20, fitness: 30 },
    { month: "Feb", business: 35, fitness: 45 },
    { month: "Mar", business: 45, fitness: 60 },
    { month: "Apr", business: 50, fitness: 70 },
    { month: "May", business: 55, fitness: 75 },
    { month: "Jun", business: 60, fitness: 85 },
  ]

  // Get current goal
  const currentGoal = userGoals.find((goal) => goal.id === selectedGoalId)

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-4 font-light"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-serif text-stone-800 mb-3">Your Journey Timeline</h1>
          <p className="text-stone-600 font-light">
            Visualize your path and celebrate milestones across all your goals.
          </p>
        </div>

        {/* Goal Selector */}
        {userGoals.length > 0 && (
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
        {userGoals.length === 0 && (
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
                            <span className="ml-2 font-medium text-stone-800">Month {milestone.month}</span>
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
                <ChartContainer
                  config={{
                    business: {
                      label: "Business Goal",
                      color: "#F87171",
                    },
                    fitness: {
                      label: "Fitness Goal",
                      color: "#8EB69B",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="business"
                        stackId="1"
                        stroke="#F87171"
                        fill="#F87171"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="fitness"
                        stackId="1"
                        stroke="#8EB69B"
                        fill="#8EB69B"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
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
                    <h4 className="font-medium text-stone-800 mb-2">This Month</h4>
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
                            Month {milestone.month}
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
          </div>
        </div>
      </div>
    </div>
  )
}
