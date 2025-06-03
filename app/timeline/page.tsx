"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, Target, CheckCircle, Heart } from "lucide-react"
import Link from "next/link"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts"
import { SiteHeader } from "@/components/site-header"

export default function Timeline() {
  const [selectedGoal, setSelectedGoal] = useState("business")

  const goals = {
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

  const currentGoal = goals[selectedGoal as keyof typeof goals]

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
        <div className="mb-8">
          <div className="flex gap-4">
            <Button
              variant={selectedGoal === "business" ? "default" : "outline"}
              onClick={() => setSelectedGoal("business")}
              className={
                selectedGoal === "business"
                  ? "bg-rose-400 hover:bg-rose-500 text-white rounded-full"
                  : "border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full"
              }
            >
              Business Goal
            </Button>
            <Button
              variant={selectedGoal === "fitness" ? "default" : "outline"}
              onClick={() => setSelectedGoal("fitness")}
              className={
                selectedGoal === "fitness"
                  ? "bg-rose-400 hover:bg-rose-500 text-white rounded-full"
                  : "border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full"
              }
            >
              Fitness Goal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline View */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Calendar className="h-5 w-5 mr-2 text-rose-400" />
                  {currentGoal.title} Timeline
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  {currentGoal.timeline} plan with key milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentGoal.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(milestone.status)}`}></div>
                        {index < currentGoal.milestones.length - 1 && (
                          <div className="w-0.5 h-12 bg-stone-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getStatusIcon(milestone.status)}
                            <span className="ml-2 font-medium text-stone-800">Month {milestone.month}</span>
                          </div>
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
                        </div>
                        <p className="text-stone-700 mb-2 font-light">{milestone.task}</p>
                        <div className="w-full bg-stone-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getStatusColor(milestone.status)}`}
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
                      {currentGoal.milestones.find((m) => m.status === "in-progress")?.task || "No active tasks"}
                    </p>
                  </div>
                  <div className="p-4 bg-sage-50 rounded-xl border border-sage-100">
                    <h4 className="font-medium text-stone-800 mb-2">Completed</h4>
                    <p className="text-stone-700 text-sm font-light">
                      {currentGoal.milestones.filter((m) => m.status === "completed").length} of{" "}
                      {currentGoal.milestones.length} milestones
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
                  className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-sage-500" />
                  Mark Milestone Complete
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
                  <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">Legal setup</p>
                      <p className="text-xs text-stone-600 font-light">Business Goal</p>
                    </div>
                    <Badge variant="outline" className="bg-white text-rose-600 border-rose-200 rounded-full">
                      5 days
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">Fitness assessment</p>
                      <p className="text-xs text-stone-600 font-light">Fitness Goal</p>
                    </div>
                    <Badge variant="outline" className="bg-white text-amber-600 border-amber-200 rounded-full">
                      12 days
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
