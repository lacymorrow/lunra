import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { GoalDataManager } from "@/lib/data-manager"
import type { SavedGoal } from "@/types"
import type { DatabaseUserProfile } from "@/types/database"

// Mock the goals service
vi.mock("@/lib/services/goals", () => ({
	getGoals: vi.fn().mockResolvedValue([]),
	createGoal: vi.fn().mockResolvedValue({}),
	updateGoal: vi.fn().mockResolvedValue({}),
	deleteGoal: vi.fn().mockResolvedValue({}),
}))

// Mock the database conversion
vi.mock("@/types/database", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/types/database")>()
	return {
		...actual,
		convertDatabaseToLocalStorage: vi.fn((dbGoal) => ({
			id: 999,
			title: dbGoal.title,
			description: dbGoal.description || "",
			timeline: dbGoal.timeline || "",
			progress: dbGoal.progress,
			status: dbGoal.status,
			dueDate: dbGoal.due_date || "",
			subGoals: dbGoal.sub_goals,
			completedSubGoals: dbGoal.completed_sub_goals,
			createdAt: dbGoal.created_at,
			milestones: dbGoal.milestones?.map((m: any) => ({
				week: m.week,
				task: m.task,
				status: m.status,
				progress: m.progress,
			})) || [],
		})),
	}
})

const makeSeedlingProfile = (): DatabaseUserProfile => ({
	id: "profile-1",
	user_id: "user-1",
	full_name: "Test User",
	avatar_url: null,
	plan_id: "seedling",
	goals_limit: 3,
	stripe_customer_id: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
})

const makeBloomProfile = (): DatabaseUserProfile => ({
	...makeSeedlingProfile(),
	plan_id: "bloom",
	goals_limit: -1,
})

const makeGoalData = (overrides: Partial<SavedGoal> = {}) => ({
	title: "Test Goal",
	description: "A test goal",
	timeline: "1 month",
	progress: 0,
	status: "in-progress",
	dueDate: "2026-04-01",
	subGoals: ["Sub 1"],
	completedSubGoals: 0,
	milestones: [
		{ week: 1, task: "Week 1 task", status: "in-progress", progress: 10 },
		{ week: 2, task: "Week 2 task", status: "pending", progress: 0 },
		{ week: 3, task: "Week 3 task", status: "pending", progress: 0 },
		{ week: 4, task: "Week 4 task", status: "pending", progress: 0 },
	],
	...overrides,
})

describe("GoalDataManager", () => {
	let manager: GoalDataManager

	beforeEach(() => {
		localStorage.clear()
		vi.useFakeTimers()
		manager = new GoalDataManager()
	})

	afterEach(() => {
		manager.destroy()
		vi.useRealTimers()
	})

	describe("constructor and properties", () => {
		it("starts unauthenticated with no args", () => {
			expect(manager.isAuthenticated).toBe(false)
			expect(manager.isPaidUser).toBe(false)
			expect(manager.shouldSync).toBe(false)
		})

		it("is authenticated with userId", () => {
			const m = new GoalDataManager("user-1")
			expect(m.isAuthenticated).toBe(true)
			expect(m.isPaidUser).toBe(false)
			m.destroy()
		})

		it("is paid user with bloom profile", () => {
			const m = new GoalDataManager("user-1", makeBloomProfile())
			expect(m.isPaidUser).toBe(true)
			expect(m.shouldSync).toBe(true)
			m.destroy()
		})

		it("is not paid user with seedling profile", () => {
			const m = new GoalDataManager("user-1", makeSeedlingProfile())
			expect(m.isPaidUser).toBe(false)
			expect(m.shouldSync).toBe(false)
			m.destroy()
		})
	})

	describe("CRUD operations", () => {
		it("getGoals returns empty array when no goals", async () => {
			const goals = await manager.getGoals()
			expect(goals).toEqual([])
		})

		it("createGoal adds a goal to localStorage", async () => {
			const goal = await manager.createGoal(makeGoalData())
			expect(goal.id).toBeDefined()
			expect(goal.title).toBe("Test Goal")
			expect(goal.createdAt).toBeDefined()

			const goals = await manager.getGoals()
			expect(goals).toHaveLength(1)
			expect(goals[0].title).toBe("Test Goal")
		})

		it("createGoal assigns incremental IDs", async () => {
			const goal1 = await manager.createGoal(makeGoalData({ title: "Goal 1" }))
			const goal2 = await manager.createGoal(makeGoalData({ title: "Goal 2" }))
			expect(goal2.id).toBe(goal1.id + 1)
		})

		it("getGoalById returns correct goal", async () => {
			const created = await manager.createGoal(makeGoalData())
			const found = await manager.getGoalById(created.id)
			expect(found).not.toBeNull()
			expect(found!.title).toBe("Test Goal")
		})

		it("getGoalById returns null for non-existent ID", async () => {
			const found = await manager.getGoalById(9999)
			expect(found).toBeNull()
		})

		it("getGoalById handles string IDs (dbId / UUID lookup)", async () => {
			const created = await manager.createGoal(makeGoalData())
			// Simulate a goal that has been synced and has a dbId
			const goals = await manager.getGoals()
			goals[0].dbId = "test-uuid-1234"
			localStorage.setItem("savedGoals", JSON.stringify(goals))

			const found = await manager.getGoalById("test-uuid-1234")
			expect(found).not.toBeNull()
			expect(found!.title).toBe(created.title)

			// Stringified numeric ID should NOT match (this was the old broken behavior)
			const notFound = await manager.getGoalById(String(created.id))
			expect(notFound).toBeNull()
		})

		it("updateGoal modifies an existing goal", async () => {
			const created = await manager.createGoal(makeGoalData())
			const updated = await manager.updateGoal(created.id, { title: "Updated Title", progress: 50 })
			expect(updated).not.toBeNull()
			expect(updated!.title).toBe("Updated Title")
			expect(updated!.progress).toBe(50)
		})

		it("updateGoal returns null for non-existent goal", async () => {
			const result = await manager.updateGoal(9999, { title: "Nope" })
			expect(result).toBeNull()
		})

		it("deleteGoal removes goal from localStorage", async () => {
			const created = await manager.createGoal(makeGoalData())
			const result = await manager.deleteGoal(created.id)
			expect(result).toBe(true)

			const goals = await manager.getGoals()
			expect(goals).toHaveLength(0)
		})

		it("deleteGoal returns false for non-existent numeric ID", async () => {
			const result = await manager.deleteGoal(9999)
			expect(result).toBe(false)
		})

		it("deleteGoal with string dbId removes matching goal", async () => {
			const created = await manager.createGoal(makeGoalData())
			// Simulate synced goal with dbId
			const goals = await manager.getGoals()
			goals[0].dbId = "test-uuid-delete"
			localStorage.setItem("savedGoals", JSON.stringify(goals))

			const result = await manager.deleteGoal("test-uuid-delete")
			expect(result).toBe(true)
			const remaining = await manager.getGoals()
			expect(remaining).toHaveLength(0)
		})

		it("deleteGoal with stringified numeric ID returns false (no match by dbId)", async () => {
			await manager.createGoal(makeGoalData())
			// This was the old broken behavior — stringified number should NOT match
			const result = await manager.deleteGoal("1")
			expect(result).toBe(false)
		})
	})

	describe("milestone operations", () => {
		it("markMilestoneComplete sets milestone to completed and advances next", async () => {
			const goal = await manager.createGoal(makeGoalData())
			await manager.markMilestoneComplete(goal.id, 0)

			const updated = await manager.getGoalById(goal.id)
			expect(updated!.milestones[0].status).toBe("completed")
			expect(updated!.milestones[0].progress).toBe(100)
			expect(updated!.milestones[1].status).toBe("in-progress")
			expect(updated!.milestones[1].progress).toBe(10)
			expect(updated!.progress).toBe(25) // 1/4
		})

		it("markMilestoneComplete calculates 100% when all milestones complete", async () => {
			const goal = await manager.createGoal(makeGoalData({
				milestones: [
					{ week: 1, task: "Task 1", status: "completed", progress: 100 },
					{ week: 2, task: "Task 2", status: "in-progress", progress: 50 },
				],
			}))
			await manager.markMilestoneComplete(goal.id, 1)

			const updated = await manager.getGoalById(goal.id)
			expect(updated!.progress).toBe(100)
			expect(updated!.status).toBe("completed")
		})

		it("markMilestoneComplete does nothing for invalid goalId", async () => {
			await manager.markMilestoneComplete(9999, 0) // should not throw
		})

		it("markMilestoneComplete does nothing for invalid milestone index", async () => {
			const goal = await manager.createGoal(makeGoalData())
			await manager.markMilestoneComplete(goal.id, 99) // should not throw
		})

		it("undoMilestoneComplete reverts milestone to pending/in-progress", async () => {
			const goal = await manager.createGoal(makeGoalData({
				milestones: [
					{ week: 1, task: "Task 1", status: "completed", progress: 100 },
					{ week: 2, task: "Task 2", status: "in-progress", progress: 10 },
					{ week: 3, task: "Task 3", status: "pending", progress: 0 },
				],
			}))
			await manager.undoMilestoneComplete(goal.id, 0)

			const updated = await manager.getGoalById(goal.id)
			expect(updated!.milestones[0].status).toBe("in-progress")
			expect(updated!.milestones[0].progress).toBe(10)
			// The next in-progress should be set back to pending
			expect(updated!.milestones[1].status).toBe("pending")
			expect(updated!.milestones[1].progress).toBe(0)
			expect(updated!.progress).toBe(0)
		})

		it("undoMilestoneComplete does nothing for invalid goalId", async () => {
			await manager.undoMilestoneComplete(9999, 0) // should not throw
		})

		it("adjustTimeline adds 1 week to all pending milestones", async () => {
			const goal = await manager.createGoal(makeGoalData({
				milestones: [
					{ week: 1, task: "Task 1", status: "completed", progress: 100 },
					{ week: 2, task: "Task 2", status: "pending", progress: 0 },
					{ week: 3, task: "Task 3", status: "pending", progress: 0 },
				],
			}))
			await manager.adjustTimeline(goal.id)

			const updated = await manager.getGoalById(goal.id)
			expect(updated!.milestones[0].week).toBe(1) // completed, unchanged
			expect(updated!.milestones[1].week).toBe(3) // pending, +1
			expect(updated!.milestones[2].week).toBe(4) // pending, +1
		})

		it("adjustTimeline does nothing for invalid goalId", async () => {
			await manager.adjustTimeline(9999) // should not throw
		})
	})

	describe("sync operations", () => {
		it("syncLocalGoalsToDatabase returns early when not authenticated", async () => {
			const result = await manager.syncLocalGoalsToDatabase()
			expect(result).toEqual({ synced: 0, skipped: 0, errors: [], clearedLocal: false })
		})

		it("syncLocalGoalsToDatabase returns early when no local goals", async () => {
			const m = new GoalDataManager("user-1", makeSeedlingProfile())
			const result = await m.syncLocalGoalsToDatabase()
			expect(result).toEqual({ synced: 0, skipped: 0, errors: [], clearedLocal: false })
			m.destroy()
		})

		it("bidirectionalSync returns early when not a paid user", async () => {
			const m = new GoalDataManager("user-1", makeSeedlingProfile())
			const result = await m.bidirectionalSync()
			expect(result).toEqual({ localToDbSynced: 0, dbToLocalSynced: 0, conflicts: 0, errors: [] })
			m.destroy()
		})
	})

	describe("setUserData", () => {
		it("updates user data and starts sync for bloom users", () => {
			manager.setUserData("user-1", makeBloomProfile())
			expect(manager.isAuthenticated).toBe(true)
			expect(manager.isPaidUser).toBe(true)
		})

		it("clears user data when null", () => {
			manager.setUserData("user-1", makeBloomProfile())
			manager.setUserData(null)
			expect(manager.isAuthenticated).toBe(false)
			expect(manager.isPaidUser).toBe(false)
		})
	})

	describe("getSyncInfo", () => {
		it("returns correct sync info for unauthenticated user", () => {
			const info = manager.getSyncInfo()
			expect(info).toEqual({
				lastSync: null,
				isPaidUser: false,
				shouldSync: false,
				autoSyncActive: false,
			})
		})

		it("returns correct sync info for bloom user with active auto-sync", () => {
			const m = new GoalDataManager("user-1", makeBloomProfile())
			const info = m.getSyncInfo()
			expect(info.isPaidUser).toBe(true)
			expect(info.shouldSync).toBe(true)
			expect(info.autoSyncActive).toBe(true)
			m.destroy()
		})
	})

	describe("destroy", () => {
		it("stops auto-sync on destroy", () => {
			const m = new GoalDataManager("user-1", makeBloomProfile())
			expect(m.getSyncInfo().autoSyncActive).toBe(true)
			m.destroy()
			expect(m.getSyncInfo().autoSyncActive).toBe(false)
		})
	})

	describe("edge cases", () => {
		it("handles multiple goals correctly", async () => {
			await manager.createGoal(makeGoalData({ title: "Goal 1" }))
			await manager.createGoal(makeGoalData({ title: "Goal 2" }))
			await manager.createGoal(makeGoalData({ title: "Goal 3" }))

			const goals = await manager.getGoals()
			expect(goals).toHaveLength(3)
		})

		it("handles goal with no milestones", async () => {
			const goal = await manager.createGoal(makeGoalData({ milestones: [] }))
			await manager.markMilestoneComplete(goal.id, 0) // should not throw
			await manager.adjustTimeline(goal.id) // should not throw
		})
	})
})
