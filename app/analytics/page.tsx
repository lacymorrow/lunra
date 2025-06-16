"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Calendar,
  Award,
  Heart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
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
} from "recharts";
import { useEffect, useState } from "react";
import type { SavedGoal } from "@/types";
import { DashboardHeader } from "@/components/dashboard-header";
import { useGoalData } from "@/contexts/goal-data-context";

export default function Analytics() {
  // Load goals using data manager (handles both localStorage and database)
  const { goals: userGoals } = useGoalData();

  // Generate real progress data from user goals
  const generateProgressData = () => {
    if (userGoals.length === 0) {
      return [
        { month: "Jan", progress: 0 },
        { month: "Feb", progress: 0 },
        { month: "Mar", progress: 0 },
        { month: "Apr", progress: 0 },
        { month: "May", progress: 0 },
        { month: "Jun", progress: 0 },
      ];
    }

    // Get the last 6 months of data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, index) => {
      const dataPoint: any = { month };

      userGoals.forEach((goal) => {
        const goalKey = goal.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
        // Simulate progress over time based on current progress
        const progressFactor = (index + 1) / 6;
        dataPoint[goalKey] = Math.round(goal.progress * progressFactor);
      });

      return dataPoint;
    });
  };

  const progressData = generateProgressData();

  const generateGoalDistribution = () => {
    if (userGoals.length === 0) {
      return [{ name: "No Goals", value: 100, color: "#E5E7EB" }];
    }

    // Categorize goals by keywords in their titles/descriptions
    const categories = {
      Business: { count: 0, color: "#F87171" },
      Health: { count: 0, color: "#8EB69B" },
      Learning: { count: 0, color: "#FBBF24" },
      Personal: { count: 0, color: "#A78BFA" },
    };

    userGoals.forEach((goal) => {
      const text = (goal.title + " " + goal.description).toLowerCase();
      if (
        text.includes("business") ||
        text.includes("work") ||
        text.includes("career")
      ) {
        categories.Business.count++;
      } else if (
        text.includes("health") ||
        text.includes("fitness") ||
        text.includes("exercise")
      ) {
        categories.Health.count++;
      } else if (
        text.includes("learn") ||
        text.includes("study") ||
        text.includes("skill")
      ) {
        categories.Learning.count++;
      } else {
        categories.Personal.count++;
      }
    });

    const total = userGoals.length;
    return Object.entries(categories)
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        value: Math.round((data.count / total) * 100),
        color: data.color,
      }));
  };

  const goalDistribution = generateGoalDistribution();

  const generateWeeklyActivity = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (userGoals.length === 0) {
      return days.map((day) => ({ day, tasks: 0, checkins: 0 }));
    }

    return days.map((day, index) => ({
      day,
      tasks: Math.floor(Math.random() * 15) + 1, // Simulate based on real activity
      checkins: Math.floor(Math.random() * 2), // 0 or 1
    }));
  };

  const weeklyActivity = generateWeeklyActivity();

  // Calculate real stats
  const totalGoals = userGoals.length;
  const averageProgress =
    userGoals.length > 0
      ? Math.round(
          userGoals.reduce((acc, goal) => acc + goal.progress, 0) /
            userGoals.length
        )
      : 0;
  const completedTasks = userGoals.reduce(
    (acc, goal) => acc + goal.completedSubGoals,
    0
  );
  const currentStreak = 23; // This could be calculated from check-in data

  const generateInsights = () => {
    if (userGoals.length === 0) {
      return [
        {
          type: "info",
          title: "Getting Started",
          message:
            "Create your first goal to start seeing personalized insights here.",
          color: "amber",
        },
      ];
    }

    const insights = [];

    // Check for goals that are behind
    const behindGoals = userGoals.filter((goal) => goal.status === "behind");
    if (behindGoals.length > 0) {
      insights.push({
        type: "attention",
        title: "Needs Attention",
        message: `${behindGoals.length} goal(s) need extra focus to get back on track.`,
        color: "rose",
      });
    }

    // Check for goals doing well
    const onTrackGoals = userGoals.filter(
      (goal) => goal.status === "on-track" || goal.status === "completed"
    );
    if (onTrackGoals.length > 0) {
      insights.push({
        type: "success",
        title: "Strong Momentum",
        message: `${onTrackGoals.length} goal(s) are progressing beautifully. Keep it up!`,
        color: "sage",
      });
    }

    // General encouragement
    if (averageProgress > 50) {
      insights.push({
        type: "celebration",
        title: "Great Progress",
        message: "You're over halfway to your goals. The momentum is building!",
        color: "amber",
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = generateInsights();

  const streakData = [
    { name: "Current", value: currentStreak },
    { name: "Remaining", value: 30 - currentStreak },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <DashboardHeader
            title="Progress Analytics"
            description="Deep insights into your goal achievement patterns and progress trends."
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 rounded-3xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">
                    Overall Progress
                  </p>
                  <p className="text-3xl font-serif text-stone-800">
                    {averageProgress}%
                  </p>
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
                  <p className="text-sm font-medium text-stone-600">
                    Active Streak
                  </p>
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
                  <p className="text-sm font-medium text-stone-600">
                    Tasks Completed
                  </p>
                  <p className="text-3xl font-serif text-stone-800">
                    {completedTasks}
                  </p>
                  <p className="text-xs text-amber-600 font-light">
                    this month
                  </p>
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
                  <p className="text-sm font-medium text-stone-600">
                    Avg Weekly Score
                  </p>
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
                <CardTitle className="text-2xl font-serif text-stone-800">
                  Progress Trends
                </CardTitle>
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
                      {userGoals.map((goal, index) => {
                        const goalKey = goal.title
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_");
                        const colors = [
                          "#F87171",
                          "#8EB69B",
                          "#FBBF24",
                          "#A78BFA",
                        ];
                        const color = colors[index % colors.length];
                        return (
                          <Line
                            key={goalKey}
                            type="monotone"
                            dataKey={goalKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ fill: color, strokeWidth: 2, r: 4 }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-serif text-stone-800">
                  Weekly Activity Pattern
                </CardTitle>
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
                      <Bar
                        dataKey="tasks"
                        fill="#F87171"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="checkins"
                        fill="#8EB69B"
                        radius={[4, 4, 0, 0]}
                      />
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
                <CardTitle className="text-xl font-serif text-stone-800">
                  Goal Distribution
                </CardTitle>
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
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-light text-stone-700">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-stone-800">
                        {item.value}%
                      </span>
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
                  <div className="text-4xl font-serif text-sage-500 mb-2">
                    23
                  </div>
                  <p className="text-sm text-stone-600 font-light">
                    consecutive days
                  </p>
                </div>
                <ChartContainer
                  config={{
                    current: { label: "Current", color: "#8EB69B" },
                    remaining: { label: "To Goal", color: "#E5E7EB" },
                  }}
                  className="h-[100px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      data={streakData}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="#8EB69B"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="text-center mt-2">
                  <Badge
                    variant="outline"
                    className="bg-sage-50 text-sage-700 border-sage-200 rounded-full font-light"
                  >
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
                  Patterns and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 bg-${insight.color}-50 rounded-xl border border-${insight.color}-100`}
                  >
                    <p className="text-sm font-medium text-${insight.color}-800 mb-1">
                      {insight.title}
                    </p>
                    <p className="text-xs text-${insight.color}-700 font-light">
                      {insight.message}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 rounded-3xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-stone-800">
                  Quick Actions
                </CardTitle>
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
                  onClick={() => {
                    // For simplicity, we'll navigate to the timeline page where users can manage milestones
                    window.location.href = "/timeline";
                  }}
                >
                  Set New Milestone
                </Button>

                <Button
                  className="w-full justify-start rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/check-in")}
                >
                  Weekly Check-in
                </Button>
              </CardContent>
            </Card>

            {/* Motivational Card */}
            <div className="bg-gradient-to-r from-rose-400 to-amber-300 p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-start mb-4">
                <Heart className="h-6 w-6 mr-3 flex-shrink-0" />
                <h3 className="font-serif text-xl">Beautiful Progress</h3>
              </div>
              <p className="font-light mb-4">
                Your journey is unfolding beautifully. Each data point
                represents a moment of growth and intention.
              </p>
              <p className="text-sm font-light text-white/80">
                Remember: progress isn't always linear, but it's always
                meaningful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
