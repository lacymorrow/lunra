"use client"

import { useState, useEffect } from "react"
import { useGoalData } from "@/contexts/goal-data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, Sparkles, MapPin } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  endTime?: string
  location?: string
  type:
    | "goal"
    | "subgoal"
    | "milestone"
    | "checkin"
    | "appointment"
    | "meeting"
    | "personal"
    | "work"
    | "health"
    | "social"
    | "travel"
    | "reminder"
  goalId?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  color: string
}

const eventTypes = [
  { value: "goal", label: "Goal", icon: "🎯", defaultColor: "#F87171" },
  { value: "subgoal", label: "Sub-goal", icon: "📋", defaultColor: "#FBBF24" },
  { value: "milestone", label: "Milestone", icon: "🏆", defaultColor: "#8EB69B" },
  { value: "checkin", label: "Check-in", icon: "✅", defaultColor: "#A78BFA" },
  { value: "appointment", label: "Appointment", icon: "🏥", defaultColor: "#06B6D4" },
  { value: "meeting", label: "Meeting", icon: "👥", defaultColor: "#3B82F6" },
  { value: "personal", label: "Personal", icon: "💝", defaultColor: "#EC4899" },
  { value: "work", label: "Work", icon: "💼", defaultColor: "#6B7280" },
  { value: "health", label: "Health & Fitness", icon: "💪", defaultColor: "#10B981" },
  { value: "social", label: "Social", icon: "🎉", defaultColor: "#F59E0B" },
  { value: "travel", label: "Travel", icon: "✈️", defaultColor: "#8B5CF6" },
  { value: "reminder", label: "Reminder", icon: "🔔", defaultColor: "#EF4444" },
]

const colorOptions = [
  { name: "Rose", value: "#F87171", bg: "bg-rose-400" },
  { name: "Pink", value: "#EC4899", bg: "bg-pink-500" },
  { name: "Purple", value: "#A78BFA", bg: "bg-purple-400" },
  { name: "Indigo", value: "#6366F1", bg: "bg-indigo-500" },
  { name: "Blue", value: "#3B82F6", bg: "bg-blue-500" },
  { name: "Cyan", value: "#06B6D4", bg: "bg-cyan-500" },
  { name: "Teal", value: "#14B8A6", bg: "bg-teal-500" },
  { name: "Green", value: "#10B981", bg: "bg-emerald-500" },
  { name: "Sage", value: "#8EB69B", bg: "bg-sage-500" },
  { name: "Lime", value: "#84CC16", bg: "bg-lime-500" },
  { name: "Yellow", value: "#EAB308", bg: "bg-yellow-500" },
  { name: "Amber", value: "#F59E0B", bg: "bg-amber-500" },
  { name: "Orange", value: "#F97316", bg: "bg-orange-500" },
  { name: "Red", value: "#EF4444", bg: "bg-red-500" },
  { name: "Gray", value: "#6B7280", bg: "bg-gray-500" },
  { name: "Stone", value: "#78716C", bg: "bg-stone-500" },
]

export default function Calendar() {
  const { goals } = useGoalData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    time: "",
    endTime: "",
    location: "",
    type: "personal" as const,
    priority: "medium" as const,
    color: "#EC4899",
  })

  // Sample events data, now without goal-related items which will be loaded dynamically
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "2",
      title: "Doctor's Appointment",
      description: "Annual checkup with Dr. Smith",
      date: "2024-01-16",
      time: "14:30",
      endTime: "15:30",
      location: "Medical Center, 123 Health St",
      type: "appointment",
      completed: false,
      priority: "high",
      color: "#06B6D4",
    },
    {
      id: "3",
      title: "Team Meeting",
      description: "Weekly team sync and project updates",
      date: "2024-01-17",
      time: "10:00",
      endTime: "11:00",
      location: "Conference Room A",
      type: "meeting",
      completed: false,
      priority: "medium",
      color: "#3B82F6",
    },
    {
      id: "4",
      title: "Gym Session",
      description: "Leg day workout",
      date: "2024-01-17",
      time: "18:00",
      endTime: "19:30",
      location: "FitLife Gym",
      type: "health",
      completed: false,
      priority: "medium",
      color: "#10B981",
    },
    {
      id: "5",
      title: "Coffee with Sarah",
      description: "Catch up with old friend",
      date: "2024-01-18",
      time: "15:00",
      endTime: "16:30",
      location: "Café Luna",
      type: "social",
      completed: false,
      priority: "low",
      color: "#F59E0B",
    },
    {
      id: "7",
      title: "Flight to NYC",
      description: "Business trip departure",
      date: "2024-01-22",
      time: "08:00",
      location: "Airport Terminal 2",
      type: "travel",
      completed: false,
      priority: "high",
      color: "#8B5CF6",
    },
  ])

  useEffect(() => {
    if (!goals) return

    const goalAndMilestoneEvents = goals.flatMap((goal) => {
      const newEvents: CalendarEvent[] = []

      // Add goal deadline
      if (goal.dueDate) {
        newEvents.push({
          id: `goal-deadline-${goal.id}`,
          title: `Deadline: ${goal.title}`,
          description: goal.description,
          date: goal.dueDate,
          type: "goal",
          goalId: String(goal.id),
          completed: goal.status === "completed",
          priority: "high",
          color: eventTypes.find((t) => t.value === "goal")?.defaultColor || "#F87171",
        })
      }

      // Add milestone deadlines
      if (goal.milestones && goal.createdAt) {
        const goalStartDate = new Date(goal.createdAt)
        goal.milestones.forEach((milestone, index) => {
          const milestoneDate = new Date(goalStartDate)
          // Set date to the end of the milestone's week
          milestoneDate.setDate(goalStartDate.getDate() + milestone.week * 7 - 1)

          newEvents.push({
            id: `milestone-${goal.id}-${index}`,
            title: milestone.task,
            date: milestoneDate.toISOString().split("T")[0],
            type: "subgoal",
            goalId: String(goal.id),
            completed: milestone.status === "completed",
            priority: "medium",
            color: eventTypes.find((t) => t.value === "subgoal")?.defaultColor || "#FBBF24",
          })
        })
      }
      return newEvents
    })

    setEvents((prevEvents) => {
      // Filter out any previous events that were generated from goals
      const userAddedEvents = prevEvents.filter(
        (e) => !e.id.startsWith("goal-deadline-") && !e.id.startsWith("milestone-"),
      )
      // Return user-added events plus the new goal-based events
      return [...userAddedEvents, ...goalAndMilestoneEvents]
    })
  }, [goals])

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return events.filter((event) => event.date === dateString)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title) return

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: selectedDate.toISOString().split("T")[0],
      time: newEvent.time,
      endTime: newEvent.endTime,
      location: newEvent.location,
      type: newEvent.type,
      completed: false,
      priority: newEvent.priority,
      color: newEvent.color,
    }

    setEvents((prev) => [...prev, event])
    setNewEvent({
      title: "",
      description: "",
      time: "",
      endTime: "",
      location: "",
      type: "personal",
      priority: "medium",
      color: "#EC4899",
    })
    setShowAddEvent(false)
  }

  const toggleEventComplete = (eventId: string) => {
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, completed: !event.completed } : event)))
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find((t) => t.value === type) || eventTypes[0]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-500"
      case "medium":
        return "bg-amber-500"
      case "low":
        return "bg-sage-500"
      default:
        return "bg-stone-500"
    }
  }

  const handleTypeChange = (type: string) => {
    const typeInfo = getEventTypeInfo(type)
    setNewEvent((prev) => ({
      ...prev,
      type: type as any,
      color: typeInfo.defaultColor,
    }))
  }

  const days = getDaysInMonth(currentDate)
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <DashboardHeader
          title="Life Calendar"
          description="Organize your goals, appointments, and life events with beautiful color coding."
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-2xl font-serif text-stone-800">
                    <CalendarIcon className="h-5 w-5 mr-2 text-rose-400" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("prev")}
                      className="rounded-full border-stone-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                      className="rounded-full border-stone-200"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("next")}
                      className="rounded-full border-stone-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-stone-600">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2 h-28"></div>
                    }

                    const dayEvents = getEventsForDate(day)
                    const isSelected = selectedDate?.toDateString() === day.toDateString()
                    const isToday = new Date().toDateString() === day.toDateString()

                    return (
                      <div
                        key={index}
                        className={`p-2 h-28 border border-stone-100 rounded-lg cursor-pointer transition-all hover:bg-stone-50 ${
                          isSelected ? "bg-rose-50 border-rose-200" : ""
                        } ${isToday ? "ring-2 ring-rose-300" : ""}`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-rose-600" : "text-stone-800"}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate text-white ${
                                event.completed ? "opacity-60 line-through" : ""
                              }`}
                              style={{ backgroundColor: event.color }}
                            >
                              <div className="flex items-center">
                                <span className="mr-1">{getEventTypeInfo(event.type).icon}</span>
                                {event.title}
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-stone-500 pl-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Color Legend */}
            <Card className="mt-6 border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">Event Types</CardTitle>
                <CardDescription className="text-stone-600 font-light">
                  Quick reference for your color-coded calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {eventTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.defaultColor }}></div>
                      <span className="text-sm text-stone-700 font-light">
                        {type.icon} {type.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            {selectedDate && (
              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-stone-800">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    {selectedDateEvents.length} events scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-xl border border-stone-200 ${event.completed ? "opacity-60" : ""}`}
                        style={{ borderLeftColor: event.color, borderLeftWidth: "4px" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <span className="mr-2">{getEventTypeInfo(event.type).icon}</span>
                            <h4 className={`font-medium text-sm ${event.completed ? "line-through" : ""}`}>
                              {event.title}
                            </h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEventComplete(event.id)}
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle
                              className={`h-4 w-4 ${event.completed ? "text-sage-500" : "text-stone-400"}`}
                            />
                          </Button>
                        </div>

                        {(event.time || event.endTime) && (
                          <div className="flex items-center text-xs text-stone-600 mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time}
                            {event.endTime && ` - ${event.endTime}`}
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center text-xs text-stone-600 mb-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        )}

                        {event.description && (
                          <p className="text-xs text-stone-600 font-light mt-2">{event.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs rounded-full">
                            {getEventTypeInfo(event.type).label}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(event.priority)}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setShowAddEvent(true)}
                    className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Add Event Form */}
            {showAddEvent && selectedDate && (
              <Card className="border-0 rounded-3xl shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-stone-800">Add New Event</CardTitle>
                  <CardDescription className="text-stone-600 font-light">
                    Schedule any type of event or appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="event-title" className="text-stone-700">
                      Title *
                    </Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title..."
                      className="rounded-xl border-stone-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-type" className="text-stone-700">
                      Type
                    </Label>
                    <Select value={newEvent.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className="rounded-xl border-stone-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <span className="mr-2">{type.icon}</span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-stone-700">Color</Label>
                    <div className="grid grid-cols-8 gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewEvent((prev) => ({ ...prev, color: color.value }))}
                          className={`w-8 h-8 rounded-full ${color.bg} ${
                            newEvent.color === color.value ? "ring-2 ring-stone-400 ring-offset-2" : ""
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="event-time" className="text-stone-700">
                        Start Time
                      </Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent((prev) => ({ ...prev, time: e.target.value }))}
                        className="rounded-xl border-stone-200 h-10 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-end-time" className="text-stone-700">
                        End Time
                      </Label>
                      <Input
                        id="event-end-time"
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent((prev) => ({ ...prev, endTime: e.target.value }))}
                        className="rounded-xl border-stone-200 h-10 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="event-location" className="text-stone-700">
                      Location
                    </Label>
                    <Input
                      id="event-location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Event location..."
                      className="rounded-xl border-stone-200"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-description" className="text-stone-700">
                      Description
                    </Label>
                    <Textarea
                      id="event-description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description..."
                      className="rounded-xl border-stone-200"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="text-stone-700">Priority</Label>
                    <div className="flex gap-2 mt-2">
                      {["low", "medium", "high"].map((priority) => (
                        <Button
                          key={priority}
                          variant={newEvent.priority === priority ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewEvent((prev) => ({ ...prev, priority: priority as any }))}
                          className={`rounded-full text-xs ${
                            newEvent.priority === priority
                              ? "bg-rose-400 hover:bg-rose-500 text-white"
                              : "border-stone-200 text-stone-700"
                          }`}
                        >
                          {priority}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddEvent}
                      className="flex-1 rounded-full bg-rose-400 hover:bg-rose-500 text-white"
                      size="sm"
                    >
                      Add Event
                    </Button>
                    <Button
                      onClick={() => setShowAddEvent(false)}
                      variant="outline"
                      className="flex-1 rounded-full border-stone-200"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-light">Total Events</span>
                  <span className="font-medium text-stone-800">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-light">Completed</span>
                  <span className="font-medium text-sage-600">{events.filter((e) => e.completed).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-light">Appointments</span>
                  <span className="font-medium text-cyan-600">
                    {events.filter((e) => e.type === "appointment").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-light">Meetings</span>
                  <span className="font-medium text-blue-600">{events.filter((e) => e.type === "meeting").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600 font-light">High Priority</span>
                  <span className="font-medium text-rose-600">
                    {events.filter((e) => e.priority === "high" && !e.completed).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Motivational Card */}
            <div className="bg-gradient-to-r from-amber-300 to-sage-300 p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-start mb-4">
                <Sparkles className="h-6 w-6 mr-3 flex-shrink-0" />
                <h3 className="font-serif text-xl">Mindful Scheduling</h3>
              </div>
              <p className="font-light mb-4">
                Your calendar reflects your priorities. Each color tells a story of how you choose to spend your
                precious time.
              </p>
              <p className="text-sm font-light text-white/80">
                Balance is beautiful - make space for goals, relationships, and rest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
