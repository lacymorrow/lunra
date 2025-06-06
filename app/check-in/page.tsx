"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TrendingUp, CheckCircle, Heart, Sparkles } from "lucide-react"
import Link from "next/link"
import { useChat } from "ai/react"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function CheckIn() {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({
    overallFeeling: "",
    progressRating: "",
    challenges: "",
    wins: "",
    nextWeekFocus: "",
  })
  const [showAICoach, setShowAICoach] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/check-in-coach",
  })

  const { toast } = useToast()

  const questions = [
    {
      id: "overallFeeling",
      title: "How are you feeling about your goals this week?",
      type: "radio",
      options: [
        { value: "excellent", label: "Excellent - Making great progress!" },
        { value: "good", label: "Good - On track with most goals" },
        { value: "okay", label: "Okay - Some progress, some challenges" },
        { value: "struggling", label: "Struggling - Falling behind" },
        { value: "stuck", label: "Stuck - Need help getting back on track" },
      ],
    },
    {
      id: "progressRating",
      title: "Rate your overall progress this week (1-10)",
      type: "radio",
      options: Array.from({ length: 10 }, (_, i) => ({
        value: (i + 1).toString(),
        label: (i + 1).toString(),
      })),
    },
    {
      id: "challenges",
      title: "What challenges did you face this week?",
      type: "textarea",
      placeholder: "Describe any obstacles, setbacks, or difficulties you encountered...",
    },
    {
      id: "wins",
      title: "What wins or progress did you make?",
      type: "textarea",
      placeholder: "Share your accomplishments, breakthroughs, or positive moments...",
    },
    {
      id: "nextWeekFocus",
      title: "What do you want to focus on next week?",
      type: "textarea",
      placeholder: "Describe your priorities and intentions for the coming week...",
    },
  ]

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete check-in and show AI coach
      setShowAICoach(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === questions.length - 1
  const canProceed = responses[currentQuestion.id as keyof typeof responses]

  if (showAICoach) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-12">
            <DashboardHeader
              title="Your Gentle Guidance"
              description="Based on your check-in, here's personalized wisdom for the week ahead."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                    <Heart className="h-5 w-5 mr-2 text-rose-400" />
                    Your Personal AI Coach
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    Thoughtful guidance based on your weekly reflection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    <div className="bg-rose-50 p-6 rounded-xl border border-rose-100">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-amber-300 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-3 text-stone-800">AI Coach</p>
                          <div className="text-stone-700 font-light space-y-4">
                            <p className="mb-3">
                              Thank you for sharing your week with me. I appreciate your thoughtful reflection.
                            </p>

                            {responses.overallFeeling === "excellent" || responses.overallFeeling === "good" ? (
                              <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl">
                                <div className="flex items-center mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                  <span className="font-medium text-stone-800">Beautiful momentum!</span>
                                </div>
                                <p className="text-stone-700 text-sm font-light">
                                  {"You're flowing beautifully with your goals. I love seeing this progress."}
                                </p>
                              </div>
                            ) : (
                              <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="flex items-center mb-2">
                                  <Heart className="h-4 w-4 text-amber-500 mr-2" />
                                  <span className="font-medium text-stone-800">Gentle reminder</span>
                                </div>
                                <p className="text-stone-700 text-sm font-light">
                                  {"Every journey has its ebbs and flows. Let's find your rhythm again together."}
                                </p>
                              </div>
                            )}

                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-stone-800 mb-2">Thoughtful Suggestions:</h4>
                                <ul className="text-sm space-y-2 ml-4 font-light">
                                  <li>{"• Break down your next week's focus into daily micro-intentions"}</li>
                                  <li>• Address the challenges you mentioned with gentle, specific steps</li>
                                  <li>• Build on your wins by noticing what made them possible</li>
                                  <li>• Schedule 15 minutes daily for mindful goal reflection</li>
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-medium text-stone-800 mb-2">Questions for Reflection:</h4>
                                <ul className="text-sm space-y-2 ml-4 font-light">
                                  <li>• What patterns do you notice in your challenges?</li>
                                  <li>• How can you bring the energy of your wins into other areas?</li>
                                  <li>• What support or resources would feel nurturing right now?</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl ${
                          message.role === "user"
                            ? "bg-stone-50 border border-stone-100 ml-8"
                            : "bg-rose-50 border border-rose-100 mr-8"
                        }`}
                      >
                        <p className="text-sm font-medium mb-2 text-stone-800">
                          {message.role === "user" ? "You" : "AI Coach"}
                        </p>
                        <p className="text-stone-700 font-light">{message.content}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask for specific advice or share more details..."
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
            </div>

            <div className="space-y-6">
              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-stone-800">Your Check-in Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <Label className="text-sm font-medium text-stone-800">Overall Feeling</Label>
                    <p className="text-sm text-stone-600 font-light capitalize">{responses.overallFeeling}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <Label className="text-sm font-medium text-stone-800">Progress Rating</Label>
                    <p className="text-sm text-stone-600 font-light">{responses.progressRating}/10</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <Label className="text-sm font-medium text-stone-800">Main Challenges</Label>
                    <p className="text-sm text-stone-600 font-light">{responses.challenges || "None mentioned"}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <Label className="text-sm font-medium text-stone-800">Key Wins</Label>
                    <p className="text-sm text-stone-600 font-light">{responses.wins || "None mentioned"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-stone-800">Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-2 text-rose-400" />
                    Update Goal Progress
                  </Button>
                  <Link href="/timeline" className="block">
                    <Button
                      className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      View Timeline
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="block">
                    <Button className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white">
                      Complete Check-in
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <DashboardHeader
            title="Weekly Reflection"
            description="Take a moment to reflect on your progress and receive gentle guidance for the week ahead."
          />
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Progress</span>
            <span className="text-sm text-stone-600 font-light">
              {currentStep + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-rose-400 to-amber-300 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">{currentQuestion.title}</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Question {currentStep + 1} of {questions.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentQuestion.type === "radio" && (
                  <RadioGroup
                    value={responses[currentQuestion.id as keyof typeof responses]}
                    onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="flex-1 cursor-pointer font-light">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === "textarea" && (
                  <Textarea
                    value={responses[currentQuestion.id as keyof typeof responses]}
                    onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="min-h-32 rounded-xl border-stone-200 focus-visible:ring-rose-400"
                  />
                )}

                <div className="flex justify-between mt-8">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="rounded-full border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                  >
                    {isLastStep ? "Complete Check-in" : "Next"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Summary */}
          <div className="space-y-6">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`p-3 rounded-xl transition-colors ${
                        index === currentStep
                          ? "bg-rose-50 border border-rose-200"
                          : responses[question.id as keyof typeof responses]
                            ? "bg-green-50 border border-green-200"
                            : "bg-stone-50 border border-stone-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-800">
                          {index + 1}. {question.title.split("?")[0]}?
                        </span>
                        {responses[question.id as keyof typeof responses] && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-stone-600 font-light">
                  <p>After completing your reflection, you'll receive:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Personalized guidance from your AI coach</li>
                    <li>• Specific suggestions for the week ahead</li>
                    <li>• Thoughtful questions for deeper reflection</li>
                    <li>• Encouragement tailored to your progress</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
