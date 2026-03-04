/**
 * Regression tests for known sync bugs between localStorage and Supabase.
 *
 * Bug 1: ID mismatch causes duplication — local goals use auto-incrementing
 *         numbers while DB goals use UUIDs. convertDatabaseToLocalStorage
 *         converts UUIDs to numbers via hex parsing, which never matches
 *         the original local ID. bidirectionalSync sees every goal as "new"
 *         on both sides and duplicates endlessly.
 *
 * Bug 2: Inconsistent dedup — syncLocalGoalsToDatabase uses title+description
 *         signatures, but bidirectionalSync uses ID matching (which never works).
 *
 * Bug 3: Type-unsafe ID comparisons — updateGoal/deleteGoal compare
 *         g.id?.toString() === id, mixing numbers and UUIDs.
 *
 * Bug 4: No mutex on auto-sync — 30s setInterval can fire mid-CRUD.
 */

import { describe, it, expect, beforeEach, vi } from "vitest"

// --- helpers ---

function makeLocalGoal(overrides: Record<string, unknown> = {}) {
	return {
		id: 1,
		title: "Learn Guitar",
		description: "Practice daily",
		timeline: "3 months",
		progress: 25,
		status: "in-progress",
		dueDate: "2026-06-01",
		subGoals: ["Chords", "Scales"],
		completedSubGoals: 0,
		createdAt: "2026-01-01T00:00:00.000Z",
		milestones: [],
		...overrides,
	}
}

function makeDatabaseGoal(overrides: Record<string, unknown> = {}) {
	return {
		id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
		user_id: "user-1",
		title: "Learn Guitar",
		description: "Practice daily",
		timeline: "3 months",
		progress: 25,
		status: "in-progress" as const,
		due_date: "2026-06-01",
		sub_goals: ["Chords", "Scales"],
		completed_sub_goals: 0,
		created_at: "2026-01-01T00:00:00.000Z",
		updated_at: "2026-01-01T00:00:00.000Z",
		milestones: [],
		...overrides,
	}
}

// --- Bug 1: UUID-to-number conversion never matches local IDs ---

describe("Bug: UUID-to-number ID mismatch", () => {
	it("convertDatabaseToLocalStorage produces IDs that never match local auto-increment IDs", async () => {
		const { convertDatabaseToLocalStorage } = await import("@/types/database")

		const dbGoal = makeDatabaseGoal()
		const converted = convertDatabaseToLocalStorage(dbGoal)

		// The converted ID is derived from UUID hex — it will be a huge number,
		// never 1, 2, 3 etc. This is the root cause of duplication.
		expect(converted.id).not.toBe(1)
		expect(converted.id).not.toBe(2)
		expect(converted.id).not.toBe(3)

		// Demonstrate the magnitude — UUID-derived IDs are enormous
		expect(converted.id).toBeGreaterThan(1000)
	})

	it("two different UUIDs can collide after substring(0,10) truncation", async () => {
		const { convertDatabaseToLocalStorage } = await import("@/types/database")

		// The conversion strips dashes then takes substring(0,10).
		// UUIDs sharing the same first 10 hex chars (after dash removal) collide.
		const goal1 = convertDatabaseToLocalStorage(
			makeDatabaseGoal({ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
		)
		const goal2 = convertDatabaseToLocalStorage(
			makeDatabaseGoal({ id: "a1b2c3d4-e500-0000-0000-000000000000" })
		)

		// BUG: these collide — first 10 hex chars sans dashes are "a1b2c3d4e5"
		expect(goal1.id).toBe(goal2.id)
	})

	it("round-trip local → DB → local loses the original ID", async () => {
		const { convertLocalStorageToDatabase, convertDatabaseToLocalStorage } =
			await import("@/types/database")

		const local = makeLocalGoal({ id: 3 })
		const asDb = convertLocalStorageToDatabase(local)
		// DB version gets a UUID-style id (or the numeric one coerced to string)
		const backToLocal = convertDatabaseToLocalStorage(
			makeDatabaseGoal({
				...asDb,
				id: "deadbeef-1234-5678-9abc-def012345678", // DB assigns UUID
			})
		)

		// BUG: the round-tripped ID ≠ original
		expect(backToLocal.id).not.toBe(3)
	})
})

// --- Bug 2: bidirectionalSync uses ID matching, which never works ---

describe("Bug: bidirectionalSync dedup is broken", () => {
	it("local goal with id=1 is not found in DB goals by ID", () => {
		const localGoals = [makeLocalGoal({ id: 1 })]
		const dbConvertedGoals = [makeLocalGoal({ id: 2863311530 })] // from UUID parse

		// This simulates what bidirectionalSync does:
		const localMap = new Map(localGoals.map((g) => [g.id, g]))
		const dbMap = new Map(dbConvertedGoals.map((g) => [g.id, g]))

		// DB goals not in local → treated as "new from server"
		const newFromServer = dbConvertedGoals.filter((g) => !localMap.has(g.id))
		// Local goals not in DB → treated as "new local"
		const newLocal = localGoals.filter((g) => !dbMap.has(g.id))

		// BUG: both sides think everything is new → duplication
		expect(newFromServer).toHaveLength(1)
		expect(newLocal).toHaveLength(1)

		// They're the same goal (same title/description) but IDs don't match
		expect(newFromServer[0].title).toBe(newLocal[0].title)
	})
})

// --- Bug 3: Type-unsafe ID comparisons ---

describe("Bug: Type-unsafe ID comparisons in CRUD", () => {
	it("string UUID cannot match numeric ID via toString", () => {
		const localGoals = [makeLocalGoal({ id: 1 })]
		const targetId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

		// This is what updateGoal/deleteGoal do:
		const found = localGoals.find(
			(g) => g.id?.toString() === targetId
		)

		// BUG: "1" !== "a1b2c3d4-..." — can never find by UUID
		expect(found).toBeUndefined()
	})

	it("numeric ID converted from UUID cannot match original numeric ID", () => {
		const uuidDerivedId = parseInt("a1b2c3d4", 16) // 2712847316
		const localGoals = [makeLocalGoal({ id: 1 })]

		const found = localGoals.find(
			(g) => g.id === uuidDerivedId
		)

		expect(found).toBeUndefined()
	})
})

// --- Bug 4: No sync mutex ---

describe("Bug: No mutex on concurrent sync operations", () => {
	it("demonstrates that two sync calls can interleave", async () => {
		// Simulate: auto-sync fires while a manual createGoal is mid-flight
		const operations: string[] = []

		const createGoal = async () => {
			operations.push("create:start")
			await new Promise((r) => setTimeout(r, 10))
			operations.push("create:end")
		}

		const autoSync = async () => {
			operations.push("sync:start")
			await new Promise((r) => setTimeout(r, 5))
			operations.push("sync:end")
		}

		// Both fire concurrently — no mutex
		await Promise.all([createGoal(), autoSync()])

		// BUG: operations interleave — sync reads stale state mid-create
		expect(operations).toEqual([
			"create:start",
			"sync:start",
			"sync:end",   // sync finishes with stale data
			"create:end", // create finishes — sync missed this
		])
	})
})

// --- Scenario: Full duplication cascade ---

describe("Scenario: Duplication cascade after purchase", () => {
	it("simulates the full bug flow", () => {
		// Step 1: User creates goals locally (free tier)
		const localGoals = [
			makeLocalGoal({ id: 1, title: "Goal A" }),
			makeLocalGoal({ id: 2, title: "Goal B" }),
		]

		// Step 2: User buys Bloom → syncLocalGoalsToDatabase runs
		// This works fine (uses title+description dedup)
		// But now DB has UUIDs for these goals

		// Step 3: bidirectionalSync fires on 30s interval
		// DB goals come back with UUID-derived numeric IDs
		const dbGoalsConverted = [
			makeLocalGoal({ id: 2863311530, title: "Goal A" }), // from UUID
			makeLocalGoal({ id: 1435671298, title: "Goal B" }), // from UUID
		]

		// Sync logic: "which DB goals are NOT in local?"
		const localIds = new Set(localGoals.map((g) => g.id))
		const newFromDb = dbGoalsConverted.filter((g) => !localIds.has(g.id))

		// BUG: ALL DB goals look "new" because IDs don't match
		expect(newFromDb).toHaveLength(2)
		// These get added to localStorage → now user has 4 goals (2 real + 2 dupes)

		// Next sync cycle: local now has 4 goals, DB still has 2
		// The 2 original local goals (id 1, 2) still don't match DB
		// → they get pushed to DB as NEW goals → DB now has 4
		// → next cycle: DB's 4 goals (all different IDs) get pulled again
		// → INFINITE DUPLICATION

		const allLocal = [...localGoals, ...newFromDb]
		expect(allLocal).toHaveLength(4) // doubled after one cycle
	})
})
