import { describe, it, expect } from "vitest"
import {
	convertLocalStorageToDatabase,
	convertDatabaseToLocalStorage,
	type DatabaseGoalWithMilestones,
} from "@/types/database"

describe("convertLocalStorageToDatabase", () => {
	it("converts a full goal correctly", () => {
		const localGoal = {
			id: 1,
			title: "Learn Piano",
			description: "Learn to play piano",
			timeline: "3 months",
			progress: 25,
			status: "in-progress",
			dueDate: "2026-06-01",
			subGoals: ["Practice scales", "Learn chords"],
			completedSubGoals: 1,
			createdAt: "2026-01-01T00:00:00Z",
			milestones: [],
		}

		const result = convertLocalStorageToDatabase(localGoal)

		expect(result.title).toBe("Learn Piano")
		expect(result.description).toBe("Learn to play piano")
		expect(result.timeline).toBe("3 months")
		expect(result.progress).toBe(25)
		expect(result.status).toBe("in-progress")
		expect(result.due_date).toBe("2026-06-01")
		expect(result.sub_goals).toEqual(["Practice scales", "Learn chords"])
		expect(result.completed_sub_goals).toBe(1)
	})

	it("handles missing optional fields with defaults", () => {
		const localGoal = {
			title: "Minimal Goal",
		}

		const result = convertLocalStorageToDatabase(localGoal)

		expect(result.title).toBe("Minimal Goal")
		expect(result.description).toBeNull()
		expect(result.timeline).toBeNull()
		expect(result.progress).toBe(0)
		expect(result.status).toBe("in-progress")
		expect(result.due_date).toBeNull()
		expect(result.sub_goals).toEqual([])
		expect(result.completed_sub_goals).toBe(0)
	})

	it("handles empty string fields as falsy (null)", () => {
		const localGoal = {
			title: "Goal",
			description: "",
			timeline: "",
			dueDate: "",
		}

		const result = convertLocalStorageToDatabase(localGoal)

		expect(result.description).toBeNull()
		expect(result.timeline).toBeNull()
		expect(result.due_date).toBeNull()
	})
})

describe("convertDatabaseToLocalStorage", () => {
	it("converts a full database goal with milestones", () => {
		const dbGoal: DatabaseGoalWithMilestones = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			user_id: "user-1",
			title: "Learn Piano",
			description: "Learn to play piano",
			timeline: "3 months",
			progress: 50,
			status: "on-track",
			due_date: "2026-06-01",
			sub_goals: ["Practice"],
			completed_sub_goals: 0,
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-02-01T00:00:00Z",
			milestones: [
				{
					id: "ms-1",
					goal_id: "goal-1",
					week: 1,
					task: "Buy piano",
					status: "completed",
					progress: 100,
					created_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
				},
				{
					id: "ms-2",
					goal_id: "goal-1",
					week: 2,
					task: "First lesson",
					status: "in-progress",
					progress: 50,
					created_at: "2026-01-01T00:00:00Z",
					updated_at: "2026-01-01T00:00:00Z",
				},
			],
		}

		const result = convertDatabaseToLocalStorage(dbGoal)

		expect(result.title).toBe("Learn Piano")
		expect(result.description).toBe("Learn to play piano")
		expect(result.timeline).toBe("3 months")
		expect(result.progress).toBe(50)
		expect(result.status).toBe("on-track")
		expect(result.dueDate).toBe("2026-06-01")
		expect(result.subGoals).toEqual(["Practice"])
		expect(result.completedSubGoals).toBe(0)
		expect(result.createdAt).toBe("2026-01-01T00:00:00Z")
		expect(typeof result.id).toBe("number")
		expect(result.milestones).toHaveLength(2)
		expect(result.milestones[0]).toEqual({
			week: 1,
			task: "Buy piano",
			status: "completed",
			progress: 100,
		})
	})

	it("handles null description and timeline", () => {
		const dbGoal: DatabaseGoalWithMilestones = {
			id: "aaaa0000-0000-0000-0000-000000000000",
			user_id: "user-1",
			title: "Goal",
			description: null,
			timeline: null,
			progress: 0,
			status: "in-progress",
			due_date: null,
			sub_goals: [],
			completed_sub_goals: 0,
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
			milestones: [],
		}

		const result = convertDatabaseToLocalStorage(dbGoal)

		expect(result.description).toBe("")
		expect(result.timeline).toBe("")
		expect(result.dueDate).toBe("")
		expect(result.milestones).toEqual([])
	})

	it("converts UUID to numeric ID deterministically", () => {
		const dbGoal: DatabaseGoalWithMilestones = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			user_id: "user-1",
			title: "Goal",
			description: null,
			timeline: null,
			progress: 0,
			status: "in-progress",
			due_date: null,
			sub_goals: [],
			completed_sub_goals: 0,
			created_at: "2026-01-01T00:00:00Z",
			updated_at: "2026-01-01T00:00:00Z",
			milestones: [],
		}

		const result1 = convertDatabaseToLocalStorage(dbGoal)
		const result2 = convertDatabaseToLocalStorage(dbGoal)

		expect(result1.id).toBe(result2.id)
		expect(typeof result1.id).toBe("number")
	})
})

describe("round-trip conversion", () => {
	it("preserves key fields through conversion", () => {
		const original = {
			id: 1,
			title: "Test Goal",
			description: "Description",
			timeline: "1 month",
			progress: 50,
			status: "on-track",
			dueDate: "2026-04-01",
			subGoals: ["Sub 1", "Sub 2"],
			completedSubGoals: 1,
			createdAt: "2026-01-01T00:00:00Z",
			milestones: [
				{ week: 1, task: "Task 1", status: "completed", progress: 100 },
			],
		}

		const dbFormat = convertLocalStorageToDatabase(original)

		expect(dbFormat.title).toBe(original.title)
		expect(dbFormat.description).toBe(original.description)
		expect(dbFormat.progress).toBe(original.progress)
		expect(dbFormat.status).toBe(original.status)
		expect(dbFormat.sub_goals).toEqual(original.subGoals)
	})
})
