"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiteHeader } from "@/components/site-header"
import SiteFooter from "@/components/site-footer" // Assuming default export
import { Heart, Brain, CalendarIcon, TrendingUp, Sparkles, ArrowRight, Lightbulb, Smile } from "lucide-react"

const processSteps = [
  {
    step: "1",
    icon: Heart,
    title: "Share Your Heart: Uncover Your Deepest Aspirations",
    description:
      "It all begins with you. In a safe and reflective space, you're invited to share your dreams, big or small. What truly matters to you? What kind of life are you yearning to create? We provide gentle prompts to help you articulate the desires that lie within, without pressure or judgment. This is your space to dream freely.",
    bgColor: "bg-rose-50",
    textColor: "text-rose-700",
    iconColor: "text-rose-500",
  },
  {
    step: "2",
    icon: Brain,
    title: "Gentle Exploration: AI-Powered Insight, Human-Centered Understanding",
    description:
      "Once you've shared your initial thoughts, our thoughtful AI companion engages with you. It's not about algorithms dictating your path, but about insightful questions that help you delve deeper. We explore your motivations, potential obstacles, and the unique context of your life. This collaborative exploration uncovers clarity and helps refine your vision into something actionable and authentic.",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    iconColor: "text-amber-500",
  },
  {
    step: "3",
    icon: CalendarIcon,
    title: "Your Mindful Plan: Crafting a Beautiful & Achievable Roadmap",
    description:
      "With a clearer understanding, we co-create your personalized roadmap. This isn't a rigid set of tasks, but a flexible, beautifully visualized plan that breaks down your larger aspirations into manageable, meaningful steps. We focus on sustainable progress, integrating your goals with your daily life and well-being. Your timeline respects your pace and celebrates the journey.",
    bgColor: "bg-sage-50",
    textColor: "text-sage-700",
    iconColor: "text-sage-500",
  },
  {
    step: "4",
    icon: TrendingUp,
    title: "Compassionate Progress: Nurturing Your Journey with Gentle Support",
    description:
      "Achieving goals is a journey, not a race. Our regular, gentle check-ins provide a space for reflection and course-correction. Celebrate your wins, acknowledge challenges with kindness, and receive encouragement from your AI companion. We help you stay connected to your 'why' and adapt your plan as you grow, ensuring your progress feels supported and joyful.",
    bgColor: "bg-stone-50",
    textColor: "text-stone-700",
    iconColor: "text-stone-500",
  },
]

const whyLunraWorks = [
  {
    icon: Lightbulb,
    title: "Mindful by Design",
    description: "Every feature is crafted to promote self-awareness and intentional action, not just task completion.",
  },
  {
    icon: Sparkles,
    title: "AI with Heart",
    description: "Our AI acts as a supportive guide, asking thoughtful questions rather than prescribing solutions.",
  },
  {
    icon: Smile,
    title: "Focus on Well-being",
    description: "We believe true success integrates your ambitions with your overall happiness and peace of mind.",
  },
]

export default function ExploreProcessPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#faf8f5" }}>
      <SiteHeader variant="landing" />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-24 h-24 bg-rose-200 rounded-full filter blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-200 rounded-full filter blur-xl"></div>
        </div>
        <div className="max-w-4xl mx-auto relative">
          <Badge className="mb-6 bg-stone-100 text-stone-700 border-stone-200 rounded-full px-4 py-2 font-light">
            <Sparkles className="h-3 w-3 mr-2 text-amber-500" />
            Our Philosophy
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-serif text-stone-800 mb-6 leading-tight">
            Our Gentle Path to Meaningful Progress
          </h1>
          <p className="text-lg text-stone-600 mb-10 leading-relaxed font-light max-w-2xl mx-auto">
            At lunra, we believe goal achievement should be an empowering and kind experience. Discover how our unique,
            AI-guided process helps you turn aspirations into realities, one thoughtful step at a time.
          </p>
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-stone-800 mb-4">Four Thoughtful Steps to Your Dreams</h2>
            <p className="text-lg text-stone-600 font-light max-w-2xl mx-auto">
              Our process is designed to be intuitive, supportive, and deeply personal, guiding you with care from
              initial dream to joyful realization.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {processSteps.map((item) => (
              <Card
                key={item.step}
                className={`border-0 shadow-lg rounded-3xl overflow-hidden transform transition-all hover:scale-105 ${item.bgColor}`}
              >
                <CardHeader className="p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className={`w-16 h-16 ${item.bgColor} border-2 ${item.textColor.replace("text-", "border-").replace("-700", "-300")} rounded-full flex items-center justify-center text-2xl font-serif ${item.textColor} mr-6 shadow-md`}
                    >
                      {item.step}
                    </div>
                    <item.icon className={`h-10 w-10 ${item.iconColor}`} />
                  </div>
                  <CardTitle className={`text-2xl font-serif ${item.textColor.replace("-700", "-800")}`}>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <CardDescription className={`${item.textColor} leading-relaxed font-light text-base`}>
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Our Process Works Section */}
      <section className="py-20 bg-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-stone-800 mb-4">More Than Just Goals, It's a Way of Being</h2>
            <p className="text-lg text-stone-600 font-light max-w-2xl mx-auto">
              lunra is built on principles of mindfulness, compassion, and sustainable growth, fostering a healthier
              relationship with your ambitions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyLunraWorks.map((item, index) => (
              <div key={index} className="text-center p-6 bg-stone-50 rounded-2xl shadow-sm">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-300 to-amber-300 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-serif text-stone-800 mb-3">{item.title}</h3>
                <p className="text-stone-600 font-light leading-relaxed text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-rose-400 via-amber-300 to-sage-400 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-white mb-8">Ready to Begin Your Mindful Journey?</h2>
          <p className="text-xl text-white/90 mb-10 font-light">
            Experience a new way of achieving your dreams, supported by thoughtful technology and a compassionate
            approach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-stone-700 hover:bg-stone-50 text-lg px-10 py-6 rounded-full font-light"
              >
                Start Your Free Plan
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white bg-white/20 hover:bg-white hover:text-stone-700 text-lg px-10 py-6 rounded-full font-light"
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-8 font-light">
            No commitment required • Always free to begin • Ready in moments
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
