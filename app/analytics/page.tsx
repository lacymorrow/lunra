"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Target, Calendar, Award, Heart, Sparkles } from "lucide-react"
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

export default function Analytics() {
  const progressData = [
    { month: "Jan", business: 20, fitness: 30, learning: 15 },
    { month: "Feb", business: 35, fitness: 45, learning: 25 },
    { month: "Mar", business: 45, fitness: 60, learning: 40 },
    { month: "Apr", business: 50, fitness: 70, learning: 55 },
    { month: "May", business: 55, fitness: 75, learning: 65 },
    { month: "Jun", business: 60, fitness: 85, learning: 70 },
  ]

  const goalDistribution = [
    { name: "Business", value: 35, color: "#F87171" },
    { name: "Health", value: 25, color: "#8EB69B" },
    { name: "Learning", value: 20, color: "#FBBF24" },
    { name: "Personal", value: 20, color: "#A78BFA" },
  ]

  const weeklyActivity = [
    { day: "Mon", tasks: 8, checkins: 1 },
    { day: "Tue", tasks: 12, checkins: 0 },
    { day: "Wed", tasks: 6, checkins: 1 },
    { day: "Thu", tasks: 15, checkins: 0 },
    { day: "Fri", tasks: 10, checkins: 1 },
    { day: "Sat", tasks: 4, checkins: 0 },
    { day: "Sun", tasks: 7, checkins: 1 },
  ]

  const streakData = [
    { name: "Current", value: 85, fill: "#8EB69B" },
    { name: "Remaining", value: 15, fill: "#E5E7EB" },
  ]

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
          <h1 className="text-4xl font-serif text-stone-800 mb-3">Progress Analytics</h1>
          <p className="text-stone-600 font-light">
            Deep insights into your goal achievement patterns and progress trends.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Overall Progress</p>
                  <p className="text-3xl font-serif text-stone-800">73%</p>
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
                  <p className="text-3xl font-serif text-stone-800">23</p>
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
                  <p className="text-3xl font-serif text-stone-800">156</p>
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
                  Track your progress across all goals over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    business: {
                      label: "Business",
                      color: "#F87171",
                    },
                    fitness: {
                      label: "Fitness",
                      color: "#8EB69B",
                    },
                    learning: {
                      label: "Learning",
                      color: "#FBBF24",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
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
                  Your task completion and check-in patterns by day
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
                  How your efforts are distributed across goal categories
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
                  <h3 className="font-serif text-xl">Current Streak</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-serif text-sage-500 mb-2">23</div>
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
                <CardDescription className="text-stone-600 font-light">Patterns and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-sm font-medium text-rose-800 mb-1">Peak Performance</p>
                  <p className="text-xs text-rose-700 font-light">
                    You're most productive on Thursdays. Consider scheduling important tasks then.
                  </p>
                </div>
                <div className="p-4 bg-sage-50 rounded-xl border border-sage-100">
                  <p className="text-sm font-medium text-sage-800 mb-1">Strong Momentum</p>
                  <p className="text-xs text-sage-700 font-light">
                    Your fitness goal is ahead of schedule. Great consistency!
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-1">Opportunity</p>
                  <p className="text-xs text-amber-700 font-light">
                    Weekend activity is low. Consider lighter goals for Sat/Sun.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <h3 className="font-serif text-xl">Beautiful Progress</h3>
              </div>
              <p className="font-light mb-4">
                Your journey is unfolding beautifully. Each data point represents a moment of growth and intention.
              </p>
              <p className="text-sm font-light text-white/80">
                Remember: progress isn't always linear, but it's always meaningful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
