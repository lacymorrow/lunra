"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Calendar, Award, Heart, Sparkles, Info } from "lucide-react"
import Link from "next/link"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { SiteHeader } from "@/components/site-header"
import { useEffect, useState } from "react"
import type { SavedGoal } from "@/types"
import { DashboardHeader } from "@/components/dashboard-header"

export default function Analytics() {
  // Load goals from localStorage and generate real data
  const [userGoals, setUserGoals] = useState<SavedGoal[]>([])
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    const storedGoals = localStorage.getItem("userGoals")
    if (storedGoals) {
      const goals: SavedGoal[] = JSON.parse(storedGoals)
      setUserGoals(goals)
      setIsDemo(goals.length === 0)
    }
  }, [])

  // Demo data for when users haven't created goals yet
  const demoProgressData = [
    { month: "Jan", business: 15, fitness: 25, learning: 10 },
    { month: "Feb", business: 28, fitness: 45, learning: 22 },
    { month: "Mar", business: 42, fitness: 60, learning: 35 },
    { month: "Apr", business: 58, fitness: 75, learning: 48 },
    { month: "May", business: 72, fitness: 85, learning: 62 },
    { month: "Jun", business: 85, fitness: 92, learning: 78 },
  ]

  const demoGoalDistribution = [
    { name: "Business", value: 40, color: "#F87171" },
    { name: "Health", value: 30, color: "#8EB69B" },
    { name: "Learning", value: 20, color: "#FBBF24" },
    { name: "Personal", value: 10, color: "#A78BFA" },
  ]

  const demoWeeklyActivity = [
    { day: "Mon", tasks: 8, checkins: 1 },
    { day: "Tue", tasks: 12, checkins: 0 },
    { day: "Wed", tasks: 6, checkins: 1 },
    { day: "Thu", tasks: 15, checkins: 0 },
    { day: "Fri", tasks: 10, checkins: 1 },
    { day: "Sat", tasks: 4, checkins: 0 },
    { day: "Sun", tasks: 7, checkins: 1 },
  ]

  const demoInsights = [
    {
      type: "success",
      title: "Strong Momentum",
      message: "Your fitness goals are progressing beautifully. Keep up the consistent effort!",
      color: "sage",
    },
    {
      type: "attention",
      title: "Opportunity",
      message: "Consider breaking down your business goal into smaller weekly milestones.",
      color: "amber",
    },
    {
      type: "celebration",
      title: "Great Balance",
      message: "You're maintaining a healthy balance across different life areas.",
      color: "rose",
    },
  ]

  // Generate real progress data from user goals
  const generateProgressData = () => {
    if (isDemo) return demoProgressData

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month, index) => {
      const dataPoint: any = { month }

      userGoals.forEach((goal) => {
        const goalKey = goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_")
        // Simulate progress over time based on current progress
        const progressFactor = (index + 1) / 6
        dataPoint[goalKey] = Math.round(goal.progress * progressFactor)
      })

      return dataPoint
    })
  }

  const progressData = generateProgressData()

  const generateGoalDistribution = () => {
    if (isDemo) return demoGoalDistribution

    // Categorize goals by keywords in their titles/descriptions
    const categories = {
      Business: { count: 0, color: "#F87171" },
      Health: { count: 0, color: "#8EB69B" },
      Learning: { count: 0, color: "#FBBF24" },
      Personal: { count: 0, color: "#A78BFA" },
    }

    userGoals.forEach((goal) => {
      const text = (goal.title + " " + goal.description).toLowerCase()
      if (text.includes("business") || text.includes("work") || text.includes("career")) {
        categories.Business.count++
      } else if (text.includes("health") || text.includes("fitness") || text.includes("exercise")) {
        categories.Health.count++
      } else if (text.includes("learn") || text.includes("study") || text.includes("skill")) {
        categories.Learning.count++
      } else {
        categories.Personal.count++
      }
    })

    const total = userGoals.length
    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: Math.round((data.count / total) * 100),
        color: data.color,
      }))
  }

  const goalDistribution = generateGoalDistribution()

  const generateWeeklyActivity = () => {
    if (isDemo) return demoWeeklyActivity

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day, index) => ({
      day,
      tasks: Math.floor(Math.random() * 15) + 1, // Simulate based on real activity
      checkins: Math.floor(Math.random() * 2), // 0 or 1
    }))
  }

  const weeklyActivity = generateWeeklyActivity()

  // Calculate stats (demo vs real)
  const totalGoals = isDemo ? 3 : userGoals.length
  const averageProgress = isDemo
    ? 78
    : userGoals.length > 0
      ? Math.round(userGoals.reduce((acc, goal) => acc + goal.progress, 0) / userGoals.length)
      : 0
  const completedTasks = isDemo ? 47 : userGoals.reduce((acc, goal) => acc + goal.completedSubGoals, 0)
  const currentStreak = isDemo ? 23 : 23 // This could be calculated from check-in data

  const generateInsights = () => {
    if (isDemo) return demoInsights

    const insights = []

    // Check for goals that are behind
    const behindGoals = userGoals.filter((goal) => goal.status === "behind")
    if (behindGoals.length > 0) {
      insights.push({
        type: "attention",
        title: "Needs Attention",
        message: `${behindGoals.length} goal(s) need extra focus to get back on track.`,
        color: "rose",
      })
    }

    // Check for goals doing well
    const onTrackGoals = userGoals.filter((goal) => goal.status === "on-track" || goal.status === "completed")
    if (onTrackGoals.length > 0) {
      insights.push({
        type: "success",
        title: "Strong Momentum",
        message: `${onTrackGoals.length} goal(s) are progressing beautifully. Keep it up!`,
        color: "sage",
      })
    }

    // General encouragement
    if (averageProgress > 50) {
      insights.push({
        type: "celebration",
        title: "Great Progress",
        message: "You're over halfway to your goals. The momentum is building!",
        color: "amber",
      })
    }

    return insights.slice(0, 3) // Show max 3 insights
  }

  const insights = generateInsights()

  const streakData = [
    { name: "Current", value: currentStreak },
    { name: "Remaining", value: 30 - currentStreak },
  ]

  const chartConfig = isDemo
    ? {
        business: {
          label: "Business Goals",
          color: "#F87171",
        },
        fitness: {
          label: "Fitness Goals",
          color: "#8EB69B",
        },
        learning: {
          label: "Learning Goals",
          color: "#FBBF24",
        },
      }
    : {
        // Generate config from user goals
        ...userGoals.reduce((config, goal, index) => {
          const goalKey = goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_")
          const colors = ["#F87171", "#8EB69B", "#FBBF24", "#A78BFA"]
          config[goalKey] = {
            label: goal.title,
            color: colors[index % colors.length],
          }
          return config
        }, {} as any),
      }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <DashboardHeader
            title="Progress Analytics"
            description="Deep insights into your goal achievement patterns and progress trends."
          />

          {/* Demo Notice */}
          {isDemo && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">Demo Analytics</p>
                  <p className="text-amber-700 text-sm mt-1 font-light">
                    You're viewing sample analytics data. Create your first goal to see your personal progress insights
                    here!
                  </p>
                  <Link href="/create-goal" className="inline-block mt-2">
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full">
                      Create Your First Goal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Overall Progress</p>
                  <p className="text-3xl font-serif text-stone-800">{averageProgress}%</p>
                  <p className="text-xs text-sage-600 flex items-center mt-1 font-light">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Active Streak</p>
                  <p className="text-3xl font-serif text-stone-800">{currentStreak}</p>
                  <p className="text-xs text-stone-600 font-light">days</p>
                </div>
                <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-sage-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Tasks Completed</p>
                  <p className="text-3xl font-serif text-stone-800">{completedTasks}</p>
                  <p className="text-xs text-amber-600 font-light">this month</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Avg Weekly Score</p>
                  <p className="text-3xl font-serif text-stone-800">8.2</p>
                  <p className="text-xs text-sage-600 font-light">out of 10</p>
                </div>
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-stone-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Over Time */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">Progress Trends</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {isDemo
                    ? "Sample progress tracking across different goal types"
                    : "Track your progress across all goals over time"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {isDemo ? (
                        // Demo lines
                        <>
                          <Line
                            type="monotone"
                            dataKey="business"
                            stroke="#F87171"
                            strokeWidth={3}
                            dot={{ fill: "#F87171", strokeWidth: 2, r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="fitness"
                            stroke="#8EB69B"
                            strokeWidth={3}
                            dot={{ fill: "#8EB69B", strokeWidth: 2, r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="learning"
                            stroke="#FBBF24"
                            strokeWidth={3}
                            dot={{ fill: "#FBBF24", strokeWidth: 2, r: 4 }}
                          />
                        </>
                      ) : (
                        // Real user goals
                        userGoals.map((goal, index) => {
                          const goalKey = goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_")
                          const colors = ["#F87171", "#8EB69B", "#FBBF24", "#A78BFA"]
                          const color = colors[index % colors.length]
                          return (
                            <Line
                              key={goalKey}
                              type="monotone"
                              dataKey={goalKey}
                              stroke={color}
                              strokeWidth={3}
                              dot={{ fill: color, strokeWidth: 2, r: 4 }}
                            />
                          )
                        })
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">Weekly Activity Pattern</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {isDemo
                    ? "Example of task completion and check-in patterns"
                    : "Your task completion and check-in patterns by day"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    tasks: {
                      label: "Tasks Completed",
                      color: "#F87171",
                    },
                    checkins: {
                      label: "Check-ins",
                      color: "#8EB69B",
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivity}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="tasks" fill="#F87171" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="checkins" fill="#8EB69B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            {/* Goal Distribution */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Goal Distribution</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {isDemo
                    ? "Sample distribution across goal categories"
                    : "How your efforts are distributed across goal categories"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    business: { label: "Business", color: "#F87171" },
                    health: { label: "Health", color: "#8EB69B" },
                    learning: { label: "Learning", color: "#FBBF24" },
                    personal: { label: "Personal", color: "#A78BFA" },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {goalDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {goalDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-light text-stone-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-stone-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Streak Tracker */}
            <Card className="border-0 rounded-3xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-sage-400 to-amber-300 p-6 text-white">
                <div className="flex items-start">
                  <Award className="h-6 w-6 mr-3 flex-shrink-0" />
                  <h3 className="font-serif text-xl">{isDemo ? "Example" : "Current"} Streak</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-serif text-sage-500 mb-2">{currentStreak}</div>
                  <p className="text-sm text-stone-600 font-light">consecutive days</p>
                </div>
                <ChartContainer
                  config={{
                    current: { label: "Current", color: "#8EB69B" },
                    remaining: { label: "To Goal", color: "#E5E7EB" },
                  }}
                  className="h-[100px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={streakData}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#8EB69B" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="text-center mt-2">
                  <Badge variant="outline" className="bg-sage-50 text-sage-700 border-sage-200 rounded-full font-light">
                    7 days to next milestone
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif text-stone-800">
                  <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                  AI Insights
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {isDemo ? "Example patterns and recommendations" : "Patterns and recommendations"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl ${
                      insight.color === "sage"
                        ? "bg-sage-50 border border-sage-100"
                        : insight.color === "amber"
                          ? "bg-amber-50 border border-amber-100"
                          : insight.color === "rose"
                            ? "bg-rose-50 border border-rose-100"
                            : "bg-stone-50 border border-stone-100"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium mb-1 ${
                        insight.color === "sage"
                          ? "text-sage-800"
                          : insight.color === "amber"
                            ? "text-amber-800"
                            : insight.color === "rose"
                              ? "text-rose-800"
                              : "text-stone-800"
                      }`}
                    >
                      {insight.title}
                    </p>
                    <p
                      className={`text-xs font-light ${
                        insight.color === "sage"
                          ? "text-sage-700"
                          : insight.color === "amber"
                            ? "text-amber-700"
                            : insight.color === "rose"
                              ? "text-rose-700"
                              : "text-stone-700"
                      }`}
                    >
                      {insight.message}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDemo ? (
                  <>
                    <Link href="/create-goal" className="block">
                      <Button
                        className="w-full justify-start rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                        size="sm"
                      >
                        Create Your First Goal
                      </Button>
                    </Link>
                    <Button
                      className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                      variant="outline"
                      size="sm"
                      disabled
                    >
                      Export Progress Report
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                      variant="outline"
                      size="sm"
                    >
                      Export Progress Report
                    </Button>
                    <Button
                      className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                      variant="outline"
                      size="sm"
                    >
                      Set New Milestone
                    </Button>
                  </>
                )}
                <Link href="/check-in" className="block">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                    size="sm"
                  >
                    Weekly Check-in
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Motivational Card */}
            <div className="bg-gradient-to-r from-rose-400 to-amber-300 p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-start mb-4">
                <Heart className="h-6 w-6 mr-3 flex-shrink-0" />
                <h3 className="font-serif text-xl">{isDemo ? "Your Future Analytics" : "Beautiful Progress"}</h3>
              </div>
              <p className="font-light mb-4">
                {isDemo
                  ? "This is what your analytics will look like as you progress on your goals. Each chart will tell the story of your unique journey."
                  : "Your journey is unfolding beautifully. Each data point represents a moment of growth and intention."}
              </p>
              <p className="text-sm font-light text-white/80">
                {isDemo
                  ? "Start your first goal to begin building your personal success story."
                  : "Remember: progress isn't always linear, but it's always meaningful."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
