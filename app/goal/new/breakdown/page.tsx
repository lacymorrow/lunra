"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Target, Calendar, Lightbulb, Heart, Sparkles } from "lucide-react"
import Link from "next/link"
import { useChat } from "ai/react"
import { SiteHeader } from "@/components/site-header"

interface Goal {
  title: string
  description: string
  timeline: string
}

export default function GoalBreakdown() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [subGoals, setSubGoals] = useState<string[]>([])

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/goal-breakdown",
    initialMessages: [],
    onFinish: (message) => {
      // Parse AI response to extract sub-goals or next questions
      if (message.content.includes("SUB_GOALS:")) {
        const goals = message.content
          .split("SUB_GOALS:")[1]
          .split("\n")
          .filter((g) => g.trim())
        setSubGoals(goals)
      }
    },
  })

  useEffect(() => {
    const storedGoal = localStorage.getItem("newGoal")
    if (storedGoal) {
      const parsedGoal = JSON.parse(storedGoal)
      setGoal(parsedGoal)

      // Start the AI conversation
      const initialPrompt = `I want to achieve this goal: "${parsedGoal.title}". ${parsedGoal.description ? `Here's more context: ${parsedGoal.description}` : ""} ${parsedGoal.timeline ? `I want to achieve this in: ${parsedGoal.timeline}` : ""}. Please ask me 3-5 specific, personalized questions to help break this down into concrete, manageable sub-goals. Don't ask generic questions like "What does this mean to you?" - instead ask specific questions about my situation, resources, experience level, constraints, or specific aspects of this goal.`

      // Simulate sending initial message
      fetch("/api/goal-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: initialPrompt }] }),
      })
    }
  }, [])

  if (!goal) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-300 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <p className="text-stone-600 mb-4 font-light">Loading your goal...</p>
            <Link href="/create-goal">
              <Button className="rounded-full bg-rose-400 hover:bg-rose-500 text-white">Go back to create goal</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <SiteHeader />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/create-goal"
            className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-4 font-light"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goal Creation
          </Link>
          <h1 className="text-4xl font-serif text-stone-800 mb-3">AI Goal Breakdown</h1>
          <p className="text-stone-600 font-light">
            Let's break down your goal into specific, gentle steps that honor your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Heart className="h-5 w-5 mr-2 text-rose-400" />
                  AI Goal Coach
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Answer these thoughtful questions to get a personalized breakdown of your goal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl ${
                        message.role === "user"
                          ? "bg-stone-50 border border-stone-100 ml-8"
                          : "bg-rose-50 border border-rose-100 mr-8"
                      }`}
                    >
                      <div className="flex items-start">
                        {message.role === "assistant" && (
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-300 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2 text-stone-800">
                            {message.role === "user" ? "You" : "AI Coach"}
                          </p>
                          <p className="text-stone-700 whitespace-pre-wrap font-light">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="bg-rose-50 border border-rose-100 mr-8 p-6 rounded-xl">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-300 rounded-full flex items-center justify-center mr-4">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2 text-stone-800">AI Coach</p>
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rose-400 mr-2"></div>
                            <p className="text-stone-600 font-light">Thinking thoughtfully...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your answer here..."
                    disabled={isLoading}
                    className="flex-1 rounded-xl border-stone-200 focus-visible:ring-rose-400"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                  >
                    Send
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Generated Sub-Goals */}
            {subGoals.length > 0 && (
              <Card className="mt-6 border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                    <Target className="h-5 w-5 mr-2 text-sage-500" />
                    Your Personalized Action Plan
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    Based on your answers, here are your specific sub-goals:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subGoals.map((subGoal, index) => (
                      <div
                        key={index}
                        className="flex items-start p-4 border border-stone-200 rounded-xl hover:shadow-sm transition-shadow"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-amber-300 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4 flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="flex-1 text-stone-700 font-light">{subGoal}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link href="/timeline" className="flex-1">
                      <Button className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Create Timeline
                      </Button>
                    </Link>
                    <Link href="/dashboard" className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
                      >
                        Save to Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Goal Summary & Progress */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Your Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-xl text-stone-800 mb-2">{goal.title}</h3>
                    {goal.description && <p className="text-stone-600 text-sm mb-3 font-light">{goal.description}</p>}
                    {goal.timeline && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-full">
                        <Calendar className="h-3 w-3 mr-1" />
                        {goal.timeline}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Breakdown Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-sage-500 mr-3" />
                    <span className="text-sm text-stone-700 font-light">Goal defined</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                        messages.length > 1 ? "bg-sage-500" : "bg-stone-300"
                      }`}
                    >
                      {messages.length > 1 && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700 font-light">AI questions answered</span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                        subGoals.length > 0 ? "bg-sage-500" : "bg-stone-300"
                      }`}
                    >
                      {subGoals.length > 0 && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700 font-light">Sub-goals generated</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-5 w-5 rounded-full mr-3 bg-stone-300"></div>
                    <span className="text-sm text-stone-700 font-light">Timeline created</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-r from-amber-300 to-sage-300 p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-start mb-4">
                <Lightbulb className="h-6 w-6 mr-3 flex-shrink-0" />
                <h3 className="font-serif text-xl">Gentle Tips</h3>
              </div>
              <div className="space-y-3 text-sm font-light text-white/90">
                <p>
                  💡 Be specific in your answers - the more detail you share, the better your personalized plan will be.
                </p>
                <p>🎯 Think about your current situation, not just your ideal scenario.</p>
                <p>⏰ Consider realistic timeframes based on your other commitments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
