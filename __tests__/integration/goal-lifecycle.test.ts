import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { GoalDataManager } from "@/lib/data-manager"
import type { SavedGoal } from "@/types"

// Mock services - we don't need real DB for integration tests
vi.mock("@/lib/services/goals", () => ({
	getGoals: vi.fn().mockResolvedValue([]),
	createGoal: vi.fn().mockResolvedValue({}),
	updateGoal: vi.fn().mockResolvedValue({}),
	deleteGoal: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/types/database", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/types/database")>()
	return {
		...actual,
		convertDatabaseToLocalStorage: vi.fn(),
	}
})

describe("Goal Lifecycle Integration", () => {
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

	it("full lifecycle: create → update → mark milestones → complete → delete", async () => {
		// Step 1: Create a goal
		const goal = await manager.createGoal({
			title: "Run a 5K",
			description: "Train for a 5K race",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: ["Week 1: Walk/jog", "Week 2: Jog", "Week 3: Run", "Week 4: Race"],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "Walk/jog 3 times", status: "in-progress", progress: 10 },
				{ week: 2, task: "Jog 3 times", status: "pending", progress: 0 },
				{ week: 3, task: "Run 2 miles", status: "pending", progress: 0 },
				{ week: 4, task: "Race day!", status: "pending", progress: 0 },
			],
		})

		expect(goal.id).toBeDefined()
		expect(goal.title).toBe("Run a 5K")

		// Verify localStorage state
		let goals = await manager.getGoals()
		expect(goals).toHaveLength(1)

		// Step 2: Mark first milestone complete
		await manager.markMilestoneComplete(goal.id, 0)

		let updated = await manager.getGoalById(goal.id)
		expect(updated!.milestones[0].status).toBe("completed")
		expect(updated!.milestones[0].progress).toBe(100)
		expect(updated!.milestones[1].status).toBe("in-progress")
		expect(updated!.progress).toBe(25) // 1/4

		// Step 3: Mark second milestone complete
		await manager.markMilestoneComplete(goal.id, 1)

		updated = await manager.getGoalById(goal.id)
		expect(updated!.milestones[1].status).toBe("completed")
		expect(updated!.milestones[2].status).toBe("in-progress")
		expect(updated!.progress).toBe(50) // 2/4
		expect(updated!.status).toBe("on-track") // >= 50%

		// Step 4: Update goal description
		await manager.updateGoal(goal.id, { description: "Training hard for race" })

		updated = await manager.getGoalById(goal.id)
		expect(updated!.description).toBe("Training hard for race")
		expect(updated!.progress).toBe(50) // Progress preserved

		// Step 5: Mark remaining milestones complete
		await manager.markMilestoneComplete(goal.id, 2)
		await manager.markMilestoneComplete(goal.id, 3)

		updated = await manager.getGoalById(goal.id)
		expect(updated!.progress).toBe(100)
		expect(updated!.status).toBe("completed")

		// Step 6: Delete the goal
		const deleted = await manager.deleteGoal(goal.id)
		expect(deleted).toBe(true)

		goals = await manager.getGoals()
		expect(goals).toHaveLength(0)
	})

	it("multiple goals with independent progress tracking", async () => {
		const goal1 = await manager.createGoal({
			title: "Goal A",
			description: "First goal",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "A1", status: "in-progress", progress: 10 },
				{ week: 2, task: "A2", status: "pending", progress: 0 },
			],
		})

		const goal2 = await manager.createGoal({
			title: "Goal B",
			description: "Second goal",
			timeline: "2 months",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-05-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "B1", status: "in-progress", progress: 10 },
				{ week: 2, task: "B2", status: "pending", progress: 0 },
			],
		})

		// Complete Goal A milestone
		await manager.markMilestoneComplete(goal1.id, 0)

		// Verify Goal A progressed but Goal B unchanged
		const a = await manager.getGoalById(goal1.id)
		const b = await manager.getGoalById(goal2.id)

		expect(a!.progress).toBe(50)
		expect(b!.progress).toBe(0)
	})

	it("undo milestone and re-complete flow", async () => {
		const goal = await manager.createGoal({
			title: "Undo Test",
			description: "Test",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "T1", status: "completed", progress: 100 },
				{ week: 2, task: "T2", status: "in-progress", progress: 10 },
				{ week: 3, task: "T3", status: "pending", progress: 0 },
			],
		})

		// Undo first milestone
		await manager.undoMilestoneComplete(goal.id, 0)

		let updated = await manager.getGoalById(goal.id)
		expect(updated!.milestones[0].status).toBe("in-progress")
		expect(updated!.milestones[1].status).toBe("pending")
		expect(updated!.progress).toBe(0)

		// Re-complete first milestone
		await manager.markMilestoneComplete(goal.id, 0)

		updated = await manager.getGoalById(goal.id)
		expect(updated!.milestones[0].status).toBe("completed")
		expect(updated!.milestones[1].status).toBe("in-progress")
		expect(updated!.progress).toBe(33) // 1/3
	})

	it("timeline adjustment flow", async () => {
		const goal = await manager.createGoal({
			title: "Adjust Test",
			description: "Test",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "T1", status: "completed", progress: 100 },
				{ week: 2, task: "T2", status: "pending", progress: 0 },
				{ week: 3, task: "T3", status: "pending", progress: 0 },
			],
		})

		await manager.adjustTimeline(goal.id)

		const updated = await manager.getGoalById(goal.id)
		expect(updated!.milestones[0].week).toBe(1) // completed - unchanged
		expect(updated!.milestones[1].week).toBe(3) // pending - shifted +1
		expect(updated!.milestones[2].week).toBe(4) // pending - shifted +1
	})

	it("offline-first: all operations work without database", async () => {
		// Create goal (no DB sync since manager is unauthenticated)
		const goal = await manager.createGoal({
			title: "Offline Goal",
			description: "Works without DB",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [
				{ week: 1, task: "T1", status: "in-progress", progress: 10 },
			],
		})

		expect(goal.title).toBe("Offline Goal")

		// Update
		await manager.updateGoal(goal.id, { title: "Updated Offline" })
		const updated = await manager.getGoalById(goal.id)
		expect(updated!.title).toBe("Updated Offline")

		// Delete
		await manager.deleteGoal(goal.id)
		const goals = await manager.getGoals()
		expect(goals).toHaveLength(0)

		// Verify localStorage is clean
		const raw = localStorage.getItem("savedGoals")
		expect(raw).toBe("[]")
	})

	it("localStorage persistence across manager instances", async () => {
		// Create with first manager
		await manager.createGoal({
			title: "Persistent Goal",
			description: "Survives manager recreation",
			timeline: "1 month",
			progress: 0,
			status: "in-progress",
			dueDate: "2026-04-01",
			subGoals: [],
			completedSubGoals: 0,
			milestones: [],
		})

		manager.destroy()

		// Create new manager - should see the goal
		const manager2 = new GoalDataManager()
		const goals = await manager2.getGoals()
		expect(goals).toHaveLength(1)
		expect(goals[0].title).toBe("Persistent Goal")
		manager2.destroy()
	})
})
