"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Brain,
  TrendingUp,
  CheckCircle,
  Calendar,
  MessageCircle,
  BarChart3,
  Star,
  ArrowRight,
  Sparkles,
  Clock,
  Heart,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "Thoughtful AI Guidance",
      description:
        "Our AI asks meaningful questions to understand your unique journey and create a plan that truly fits your life.",
      color: "bg-stone-100 text-stone-600",
    },
    {
      icon: Calendar,
      title: "Beautiful Timeline Planning",
      description:
        "Visualize your path forward with elegant timelines that make your progress feel tangible and inspiring.",
      color: "bg-rose-100 text-rose-600",
    },
    {
      icon: MessageCircle,
      title: "Gentle Check-ins",
      description:
        "Weekly reflections that feel like conversations with a wise friend, keeping you gently accountable.",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: BarChart3,
      title: "Mindful Progress Tracking",
      description:
        "Beautiful insights that help you understand your patterns and celebrate every step of your journey.",
      color: "bg-sage-100 text-sage-600",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Creative Entrepreneur",
      content:
        "lunra helped me turn my scattered dreams into a beautiful, achievable plan. The AI feels like having a wise mentor by my side.",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Mindful Leader",
      content:
        "Finally, a goal app that honors the journey as much as the destination. It's thoughtful, gentle, and incredibly effective.",
      rating: 5,
    },
    {
      name: "Emily Watson",
      role: "Life Designer",
      content:
        "The weekly check-ins are like therapy sessions for my goals. I feel supported, not judged, every step of the way.",
      rating: 5,
    },
  ]

  const stats = [
    { number: "10,000+", label: "Dreams Realized" },
    { number: "85%", label: "Feel More Fulfilled" },
    { number: "4.9/5", label: "Love the Journey" },
    { number: "50+", label: "Countries Touched" },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      {/* Hero Section */}
      <section className="pt-20 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-32 h-32 bg-rose-200 rounded-full opacity-40"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-amber-200 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-stone-200 rounded-full opacity-50"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-rose-100 text-rose-700 border-rose-200 rounded-full px-4 py-2 font-light">
                <Sparkles className="h-3 w-3 mr-2" />
                thoughtfully crafted
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-serif text-stone-800 mb-8 leading-tight">
                turn your dreams into
                <span className="italic text-rose-500"> progress</span>
              </h1>
              <p className="text-xl text-stone-600 mb-10 leading-relaxed font-light max-w-xl">
                A mindful approach to goal setting that honors your unique journey, celebrates small wins, and creates
                lasting change through compassionate planning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-6 bg-rose-400 hover:bg-rose-500 text-white rounded-full font-light"
                  >
                    Begin Your Journey
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/explore-process">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-6 border-stone-300 text-stone-700 hover:bg-stone-50 rounded-full font-light"
                  >
                    Explore the Process
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-stone-500 font-light">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-rose-400 mr-2" />
                  no pressure, just progress
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-rose-400 mr-2" />
                  always free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-rose-400 mr-2" />
                  ready in moments
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-10 border border-stone-100">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-serif text-stone-800">create a meaningful business</h3>
                    <Badge className="bg-sage-100 text-sage-700 font-light rounded-full">flowing beautifully</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-sage-500 mr-4" />
                      <span className="text-stone-700 font-light">explored my core values & vision</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-sage-500 mr-4" />
                      <span className="text-stone-700 font-light">crafted a gentle business plan</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-amber-500 mr-4" />
                      <span className="text-stone-700 font-light">building my online presence mindfully</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-stone-400 mr-4" />
                      <span className="text-stone-500 font-light">preparing for soft launch</span>
                    </div>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                    <div className="flex items-start">
                      <Heart className="h-5 w-5 text-rose-500 mr-4 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-rose-800 mb-2">gentle wisdom</p>
                        <p className="text-sm text-rose-700 font-light leading-relaxed">
                          You're moving at exactly the right pace. Trust the process and celebrate this beautiful
                          progress.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating organic elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-rose-300 to-amber-300 text-white p-4 rounded-full shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-br from-sage-300 to-stone-300 text-white p-4 rounded-full shadow-lg">
                <Heart className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-serif text-stone-800 mb-3">{stat.number}</div>
                <div className="text-stone-600 font-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6" style={{ backgroundColor: "#faf8f5" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif text-stone-800 mb-6">everything you need for mindful progress</h2>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto font-light leading-relaxed">
              We've thoughtfully crafted each feature to support your unique journey, honoring both your ambitions and
              your well-being.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl bg-white hover:scale-105 hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl font-serif text-stone-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-stone-600 leading-relaxed font-light">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif text-stone-800 mb-6">a gentle path to your dreams</h2>
            <p className="text-xl text-stone-600 font-light">
              Four thoughtful steps to transform your aspirations into reality
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                step: "1",
                title: "Share Your Heart",
                description: "Tell us about your dreams and aspirations - we listen with care and without judgment.",
                icon: Heart,
              },
              {
                step: "2",
                title: "Gentle Exploration",
                description: "Our AI asks thoughtful questions to understand your unique circumstances and desires.",
                icon: Brain,
              },
              {
                step: "3",
                title: "Your Mindful Plan",
                description: "Receive a beautiful roadmap designed specifically for your life, values, and timeline.",
                icon: Calendar,
              },
              {
                step: "4",
                title: "Compassionate Progress",
                description: "Regular check-ins that celebrate your journey and gently guide you forward.",
                icon: TrendingUp,
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-amber-400 text-white rounded-full flex items-center justify-center text-xl font-serif mx-auto mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg absolute -bottom-3 -right-3 border border-stone-100">
                    <item.icon className="h-7 w-7 text-stone-600" />
                  </div>
                </div>
                <h3 className="text-xl font-serif text-stone-800 mb-4">{item.title}</h3>
                <p className="text-stone-600 font-light leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6" style={{ backgroundColor: "#faf8f5" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif text-stone-800 mb-6">stories of gentle transformation</h2>
            <p className="text-xl text-stone-600 font-light">
              Hear from dreamers who've found their way through mindful planning
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white rounded-3xl">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-stone-700 mb-8 leading-relaxed font-light italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-serif text-stone-800 text-lg">{testimonial.name}</div>
                    <div className="text-stone-500 text-sm font-light">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-serif text-stone-800 mb-6">choose your journey</h2>
            <p className="text-xl text-stone-600 font-light">
              Begin freely, expand when you're ready for deeper support
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Seedling",
                price: "$0",
                period: "forever",
                description: "Perfect for nurturing your first dreams into reality",
                features: [
                  "3 cherished goals",
                  "gentle AI guidance",
                  "weekly reflections",
                  "progress celebration",
                  "mobile companion",
                ],
                cta: "Begin Growing",
                popular: false,
              },
              {
                name: "Bloom",
                price: "$9",
                period: "per month",
                description: "For dreamers ready to flourish with deeper support",
                features: [
                  "unlimited aspirations",
                  "advanced AI mentorship",
                  "custom timelines",
                  "detailed insights",
                  "community connection",
                  "priority care",
                ],
                cta: "Start Blooming",
                popular: true,
              },
              {
                name: "Garden",
                price: "$19",
                period: "per month",
                description: "For teams cultivating shared visions together",
                features: [
                  "everything in Bloom",
                  "collaborative spaces",
                  "team insights",
                  "shared celebrations",
                  "custom integrations",
                  "dedicated support",
                ],
                cta: "Grow Together",
                popular: false,
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={`relative border-0 shadow-lg rounded-3xl bg-white ${plan.popular ? "ring-2 ring-rose-300" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-rose-400 text-white px-6 py-2 rounded-full font-light">most cherished</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-serif text-stone-800">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-4xl font-serif text-stone-800">{plan.price}</span>
                    <span className="text-stone-600 font-light">/{plan.period}</span>
                  </div>
                  <CardDescription className="mt-6 font-light leading-relaxed">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-sage-500 mr-4" />
                        <span className="text-stone-700 font-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard" className="block">
                    <Button
                      className={`w-full rounded-full font-light ${plan.popular ? "bg-rose-400 hover:bg-rose-500 text-white" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-rose-400 via-amber-300 to-sage-400 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-white mb-8">ready to honor your dreams?</h2>
          <p className="text-xl text-white/90 mb-10 font-light">
            Join thousands of mindful achievers who've discovered the joy of gentle, meaningful progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-stone-700 hover:bg-stone-50 text-lg px-10 py-6 rounded-full font-light"
              >
                Begin Your Journey
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white bg-white/20 hover:bg-white hover:text-stone-700 text-lg px-10 py-6 rounded-full font-light"
            >
              Explore the Experience
            </Button>
          </div>
          <p className="text-white/80 text-sm mt-8 font-light">
            no commitment required • always free to begin • ready in moments
          </p>
        </div>
      </section>
    </div>
  )
}
