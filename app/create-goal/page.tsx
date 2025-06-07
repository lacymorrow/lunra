"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Heart, Target, Calendar, Brain } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"

export default function CreateGoal() {
  const router = useRouter()
  const [goalTitle, setGoalTitle] = useState("")
  const [goalDescription, setGoalDescription] = useState("")
  const [timeline, setTimeline] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to AI breakdown page with the goal data
    const goalData = {
      title: goalTitle,
      description: goalDescription,
      timeline: timeline,
    }

    localStorage.setItem("newGoal", JSON.stringify(goalData))
    router.push("/goal/new/breakdown")
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <DashboardHeader
          title="Create a New Goal"
          description="Start by describing your dream, and our AI will help you break it down into gentle, achievable steps."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Goal Creation Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">Tell us about your goal</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Be as specific or as broad as you'd like - our AI will help you refine it with care.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-stone-700">
                      Goal Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Start my own business, Get in shape, Learn a new skill"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      required
                      className="rounded-xl border-stone-200 focus-visible:ring-rose-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-stone-700">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this goal means to you, why it's important, or any specific details..."
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      rows={4}
                      className="rounded-xl border-stone-200 focus-visible:ring-rose-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timeline" className="text-stone-700">
                      Desired Timeline
                    </Label>
                    <Input
                      id="timeline"
                      placeholder="e.g., 6 months, 1 year, by December 2024"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="rounded-xl border-stone-200 focus-visible:ring-rose-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white py-6"
                    disabled={!goalTitle || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Get AI Breakdown
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Tips and Examples */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Tips for Better Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-800 mb-1">Be Authentic</h4>
                    <p className="text-sm text-stone-600 font-light">
                      Choose goals that truly matter to you, not what others expect.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Brain className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-800 mb-1">Start Broad</h4>
                    <p className="text-sm text-stone-600 font-light">
                      Our AI will help you break down big dreams into manageable steps.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-sage-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <Target className="h-4 w-4 text-sage-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-stone-800 mb-1">Include Context</h4>
                    <p className="text-sm text-stone-600 font-light">
                      Share why this goal matters to get more personalized guidance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Example Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-sm font-medium text-stone-800">"Launch my own consulting business"</p>
                  <p className="text-xs text-stone-600 mt-1 font-light">Career & Business</p>
                </div>
                <div className="p-4 bg-sage-50 rounded-xl border border-sage-100">
                  <p className="text-sm font-medium text-stone-800">"Run a half marathon"</p>
                  <p className="text-xs text-stone-600 mt-1 font-light">Health & Fitness</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-stone-800">"Learn to play piano"</p>
                  <p className="text-xs text-stone-600 mt-1 font-light">Personal Development</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                  <p className="text-sm font-medium text-stone-800">"Buy my first home"</p>
                  <p className="text-xs text-stone-600 mt-1 font-light">Financial</p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-r from-rose-400 to-amber-300 p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-start mb-4">
                <Calendar className="h-6 w-6 mr-3 flex-shrink-0" />
                <h3 className="font-serif text-xl">Ready when you are</h3>
              </div>
              <p className="font-light mb-4">
                There's no rush. Take your time to reflect on what truly matters to you.
              </p>
              <p className="text-sm font-light text-white/80">
                Your journey is unique, and we're here to support you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
