"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Target, Calendar, Lightbulb, Heart, Sparkles, AlertCircle, Save } from "lucide-react"
import Link from "next/link"
import { useChat } from "ai/react"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { DashboardHeader } from "@/components/dashboard-header"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useGoalData } from "@/contexts/goal-data-context"

interface Goal {
  title: string
  description: string
  timeline: string
}

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

export default function GoalBreakdown() {
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [subGoals, setSubGoals] = useState<string[]>([])
  const [hasInitialized, setHasInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

  const [allGeneratedGoals, setAllGeneratedGoals] = useState<
    Array<{
      title: string
      description: string
      timeline: string
      subGoals: string[]
      milestones: Array<{
        week: number
        task: string
        status: string
        progress: number
      }>
    }>
  >([])
  const [isCreatingMultiple, setIsCreatingMultiple] = useState(false)
  const [parentGoalTitle, setParentGoalTitle] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const { toast } = useToast()

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/goal-breakdown",
    onFinish: (message) => {
      console.log("AI Response:", message.content)
      setError(null) // Clear any previous errors

      // Count questions asked (assistant messages that don't contain SUB_GOALS)
      if (message.role === "assistant" && !message.content.includes("SUB_GOALS:")) {
        setQuestionCount((prev) => prev + 1)
      }

      // Parse AI response to extract sub-goals
      if (message.content.includes("SUB_GOALS:")) {
        const goalSection = message.content.split("SUB_GOALS:")[1]
        const goals = goalSection
          .split("\n")
          .filter((g) => g.trim() && g.match(/^\d+\./))
          .map((g) => g.replace(/^\d+\.\s*/, "").trim())
        console.log("Extracted sub-goals:", goals)
        setSubGoals(goals)
      }

      if (message.content.includes("MULTIPLE_TIMELINES:")) {
        const timelinesSection = message.content.split("MULTIPLE_TIMELINES:")[1]
        const timelineBlocks = timelinesSection.split(/TIMELINE_\d+:/).filter((block) => block.trim())

        const parsedGoals = timelineBlocks.map((block, index) => {
          const lines = block.split("\n").filter((line) => line.trim())
          const titleLine = lines.find((line) => line.includes("TITLE:"))
          const goalTitle = titleLine ? titleLine.replace("TITLE:", "").trim() : `Timeline ${index + 1}`

          const goalLines = lines.filter((line) => line.match(/^\d+\./))
          const goals = goalLines.map((g) => g.replace(/^\d+\.\s*/, "").trim())

          const milestones = goals.map((goalText, idx) => {
            let week = idx + 1
            let task = goalText

            const weekMatch = goalText.match(/^\[Week\s+(\d+)\]\s+(.+)$/i)
            if (weekMatch) {
              week = Number.parseInt(weekMatch[1], 10)
              task = weekMatch[2].trim()
            }

            return {
              week: week,
              task: task,
              status: idx === 0 ? "in-progress" : "pending",
              progress: idx === 0 ? 10 : 0,
            }
          })

          return {
            title: goalTitle,
            description: `Part of: ${goal?.title || "Multi-timeline goal"}`,
            timeline: goal?.timeline || "",
            subGoals: goals,
            milestones: milestones,
          }
        })

        setAllGeneratedGoals(parsedGoals)
        setIsCreatingMultiple(true)
        setParentGoalTitle(goal?.title || "Multi-timeline goal")
      }
    },
    onError: (error) => {
      console.error("Chat error details:", error)
      setError(`AI service error: ${error.message || "Unknown error occurred"}`)
    },
  })

  // Save goal to localStorage and application state
  const { dataManager, refreshGoals } = useGoalData()

  const saveGoalToApp = async () => {
    if (!goal || subGoals.length === 0) return

    setIsSaving(true)
    try {
      toast({
        title: "Saving your goal...",
        description: "Creating your personalized action plan",
      })

      // Create timeline milestones from sub-goals
      const milestones = subGoals.map((subGoal, index) => {
        let week = index + 1
        let task = subGoal

        const weekMatch = subGoal.match(/^\[Week\s+(\d+)\]\s+(.+)$/i)
        if (weekMatch) {
          week = Number.parseInt(weekMatch[1], 10)
          task = weekMatch[2].trim()
        }

        let maxWeeks = 4
        if (goal.timeline) {
          const monthsMatch = goal.timeline.match(/(\d+)\s*month/i)
          const weeksMatch = goal.timeline.match(/(\d+)\s*week/i)

          if (monthsMatch) {
            maxWeeks = Number.parseInt(monthsMatch[1], 10) * 4
          } else if (weeksMatch) {
            maxWeeks = Number.parseInt(weeksMatch[1], 10)
          }
        }

        week = Math.min(week, maxWeeks)

        return {
          week: week,
          task: task,
          status: index === 0 ? "in-progress" : "pending",
          progress: index === 0 ? 10 : 0,
        }
      })

      // Calculate due date based on timeline
      const dueDate = new Date()
      if (goal.timeline.toLowerCase().includes("month")) {
        const months = Number.parseInt(goal.timeline.match(/\d+/)?.[0] || "6")
        dueDate.setMonth(dueDate.getMonth() + months)
      } else if (goal.timeline.toLowerCase().includes("year")) {
        const years = Number.parseInt(goal.timeline.match(/\d+/)?.[0] || "1")
        dueDate.setFullYear(dueDate.getFullYear() + years)
      } else {
        dueDate.setMonth(dueDate.getMonth() + 6)
      }

      // Create new goal object
      const newGoal: Omit<SavedGoal, "id"> = {
        title: goal.title,
        description: goal.description || "",
        timeline: goal.timeline || "",
        progress: 5,
        status: "in-progress",
        dueDate: dueDate.toISOString().split("T")[0],
        subGoals: subGoals,
        completedSubGoals: 0,
        createdAt: new Date().toISOString(),
        milestones: milestones,
      }

      // Save using data manager
      const savedGoal = await dataManager.createGoal(newGoal)

      // Clean up the temporary goal data
      localStorage.removeItem("newGoal")

      console.log("Goal saved successfully:", savedGoal)
      setHasSaved(true)

      toast({
        title: "Goal saved successfully! 🎉",
        description: "Your timeline has been created and saved to your dashboard",
      })

      // Refresh goals in context
      await refreshGoals()

      setTimeout(() => {
        setIsSaving(false)
        toast({
          title: "Redirecting to timeline...",
          description: "Taking you to your personalized timeline view",
        })
        router.push("/timeline")
      }, 1000)
    } catch (error) {
      console.error("Error saving goal:", error)
      setError("Failed to save goal. Please try again.")

      toast({
        title: "Error saving goal",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })

      setIsSaving(false)
    }
  }

  const saveMultipleGoalsToApp = async () => {
    if (!goal || allGeneratedGoals.length === 0) return

    setIsSaving(true)
    try {
      toast({
        title: "Saving your timelines...",
        description: `Creating ${allGeneratedGoals.length} personalized timelines`,
      })

      const newGoals: Array<Omit<SavedGoal, "id">> = allGeneratedGoals.map((timeline) => {
        const dueDate = new Date()
        if (goal.timeline.toLowerCase().includes("month")) {
          const months = Number.parseInt(goal.timeline.match(/\d+/)?.[0] || "6")
          dueDate.setMonth(dueDate.getMonth() + months)
        } else {
          dueDate.setMonth(dueDate.getMonth() + 6)
        }

        return {
          title: timeline.title,
          description: timeline.description,
          timeline: timeline.timeline,
          progress: 5,
          status: "in-progress",
          dueDate: dueDate.toISOString().split("T")[0],
          subGoals: timeline.subGoals,
          completedSubGoals: 0,
          createdAt: new Date().toISOString(),
          milestones: timeline.milestones,
        }
      })

      // Save all goals using data manager
      const savedGoals = await Promise.all(newGoals.map((goalData) => dataManager.createGoal(goalData)))

      localStorage.removeItem("newGoal")

      console.log("Multiple goals saved successfully:", savedGoals)
      setHasSaved(true)

      toast({
        title: "Timelines created successfully! 🎉",
        description: `${savedGoals.length} timelines have been saved to your dashboard`,
      })

      // Refresh goals in context
      await refreshGoals()

      setTimeout(() => {
        setIsSaving(false)
        toast({
          title: "Redirecting to timeline...",
          description: "Taking you to your personalized timeline view",
        })
        router.push("/timeline")
      }, 1000)
    } catch (error) {
      console.error("Error saving multiple goals:", error)
      setError("Failed to save goals. Please try again.")

      toast({
        title: "Error saving timelines",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })

      setIsSaving(false)
    }
  }

  // Navigate to timeline with saved goal
  const goToTimeline = () => {
    if (hasSaved) {
      toast({
        title: "Redirecting to timeline...",
        description: "Taking you to your personalized timeline view",
      })
      router.push("/timeline")
    } else {
      // Save first, then navigate
      saveGoalToApp().then(() => {
        setTimeout(() => {
          toast({
            title: "Redirecting to timeline...",
            description: "Taking you to your personalized timeline view",
          })
          router.push("/timeline")
        }, 1500)
      })
    }
  }

  // Navigate to dashboard with saved goal
  const goToDashboard = () => {
    if (hasSaved) {
      toast({
        title: "Redirecting to dashboard...",
        description: "Taking you to your goal dashboard",
      })
      router.push("/dashboard")
    } else {
      // Save first, then navigate
      saveGoalToApp().then(() => {
        setTimeout(() => {
          toast({
            title: "Redirecting to dashboard...",
            description: "Taking you to your goal dashboard",
          })
          router.push("/dashboard")
        }, 1500)
      })
    }
  }

  // Initialize the conversation when goal is loaded
  useEffect(() => {
    const storedGoal = localStorage.getItem("newGoal")
    if (storedGoal && !hasInitialized) {
      try {
        const parsedGoal = JSON.parse(storedGoal)
        setGoal(parsedGoal)

        // Create initial prompt that asks for ONE question
        const initialPrompt = `I want to achieve this goal: "${parsedGoal.title}". ${
          parsedGoal.description ? `Here's more context: ${parsedGoal.description}` : ""
        } ${
          parsedGoal.timeline ? `I want to achieve this in: ${parsedGoal.timeline}` : ""
        }. Please ask me ONE specific, personalized question to help break this down into concrete, manageable sub-goals. Start with understanding my experience level or current situation with this type of goal.`

        console.log("Sending initial prompt:", initialPrompt)

        // Send the initial message to start the conversation
        setTimeout(() => {
          append({
            role: "user",
            content: initialPrompt,
          })
        }, 1000)

        setHasInitialized(true)
      } catch (error) {
        console.error("Error parsing stored goal:", error)
        setError("Failed to load your goal. Please try creating a new goal.")
      }
    }
  }, [append, hasInitialized])

  // Debug: Log messages changes
  useEffect(() => {
    console.log("Messages updated:", messages)
  }, [messages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

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
        <DashboardHeader
          title="AI Goal Breakdown"
          description="Let's break down your goal into specific, gentle steps that honor your journey."
          backHref="/create-goal"
          backText="Back to Goal Creation"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-3xl shadow-md flex flex-col max-h-[80vh] min-h-[450px]">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                  <Heart className="h-5 w-5 mr-2 text-rose-400" />
                  AI Goal Coach
                </CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Answer each question thoughtfully to get a personalized breakdown of your goal.
                  {questionCount > 0 && subGoals.length === 0 && (
                    <span className="block mt-1 text-rose-500">Question {questionCount} of 3-5</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow overflow-hidden p-6">
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-medium">Something went wrong</p>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                        <Button
                          onClick={() => {
                            setError(null)
                            setHasInitialized(false)
                            setQuestionCount(0)
                            // Retry initialization
                            setTimeout(() => {
                              const storedGoal = localStorage.getItem("newGoal")
                              if (storedGoal) {
                                const parsedGoal = JSON.parse(storedGoal)
                                const initialPrompt = `I want to achieve this goal: "${parsedGoal.title}". Please ask me ONE specific question to help break this down.`
                                append({
                                  role: "user",
                                  content: initialPrompt,
                                })
                                setHasInitialized(true)
                              }
                            }, 500)
                          }}
                          className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800"
                          size="sm"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-grow space-y-4 mb-4 overflow-y-auto pr-2">
                  {messages.length === 0 && !isLoading && !error && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-stone-600 font-light">Starting your AI coaching session...</p>
                    </div>
                  )}

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
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-stone-200 flex-shrink-0">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your answer here..."
                    disabled={isLoading || !!error}
                    className="flex-1 rounded-xl border-stone-200 focus-visible:ring-rose-400"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || !!error}
                    className="rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                  >
                    Send
                  </Button>
                </form>

                {/* Debug info - remove in production */}
                <Collapsible defaultOpen={false} className="mt-2 flex-shrink-0">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="mt-4 text-xs text-gray-600 hover:text-gray-800">
                      Show Debug Info
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600">
                      <p>Debug: Messages count: {messages.length}</p>
                      <p>Questions asked: {questionCount}</p>
                      <p>Sub-goals: {subGoals.length}</p>
                      <p>Has saved: {hasSaved ? "Yes" : "No"}</p>
                      <p>Loading: {isLoading ? "Yes" : "No"}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
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

                  {/* Save Status */}
                  {hasSaved && (
                    <div className="mt-4 p-3 bg-sage-50 border border-sage-200 rounded-xl">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-sage-600 mr-2" />
                        <span className="text-sage-800 text-sm font-medium">Goal saved successfully!</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={goToTimeline}
                      disabled={isSaving}
                      className="flex-1 rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Timeline
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={goToDashboard}
                      disabled={isSaving}
                      variant="outline"
                      className="flex-1 rounded-full border-stone-200 text-stone-700 hover:bg-stone-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-stone-400 mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save to Dashboard
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multiple Timelines Display */}
            {isCreatingMultiple && allGeneratedGoals.length > 0 && (
              <Card className="mt-6 border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                    <Target className="h-5 w-5 mr-2 text-sage-500" />
                    Your Multiple Timelines
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    {parentGoalTitle} broken down into {allGeneratedGoals.length} focused timelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {allGeneratedGoals.map((timeline, timelineIndex) => (
                      <div key={timelineIndex} className="border border-stone-200 rounded-xl p-6">
                        <h3 className="font-serif text-xl text-stone-800 mb-4">{timeline.title}</h3>
                        <div className="space-y-3">
                          {timeline.subGoals.map((subGoal, index) => (
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
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={() => saveMultipleGoalsToApp()}
                      disabled={isSaving}
                      className="flex-1 rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving All Timelines...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Create All Timelines
                        </>
                      )}
                    </Button>
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
                        questionCount > 0 ? "bg-sage-500" : "bg-stone-300"
                      }`}
                    >
                      {questionCount > 0 && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700 font-light">
                      AI questions answered ({questionCount}/3-5)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                        subGoals.length > 0 || allGeneratedGoals.length > 0 ? "bg-sage-500" : "bg-stone-300"
                      }`}
                    >
                      {(subGoals.length > 0 || allGeneratedGoals.length > 0) && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-stone-700 font-light">
                      Sub-goals generated{" "}
                      {subGoals.length > 0
                        ? `(${subGoals.length})`
                        : allGeneratedGoals.length > 0
                          ? `(${allGeneratedGoals.length} timelines)`
                          : ""}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center ${
                        hasSaved ? "bg-sage-500" : "bg-stone-300"
                      }`}
                    >
                      {hasSaved && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm text-stone-700 font-light">Goal saved</span>
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
