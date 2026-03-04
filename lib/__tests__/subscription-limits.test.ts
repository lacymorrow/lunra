import { describe, it, expect } from "vitest"
import { canCreateGoal, getGoalsLimit, getRemainingGoals, getLimitMessage } from "@/lib/subscription-limits"
import type { DatabaseUserProfile } from "@/types/database"

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

describe("canCreateGoal", () => {
	it("returns true for null profile when under limit", () => {
		expect(canCreateGoal(null, 0)).toBe(true)
		expect(canCreateGoal(null, 1)).toBe(true)
		expect(canCreateGoal(null, 2)).toBe(true)
	})

	it("returns false for null profile when at or above limit", () => {
		expect(canCreateGoal(null, 3)).toBe(false)
		expect(canCreateGoal(null, 5)).toBe(false)
	})

	it("returns true for seedling profile when under limit", () => {
		expect(canCreateGoal(makeSeedlingProfile(), 0)).toBe(true)
		expect(canCreateGoal(makeSeedlingProfile(), 2)).toBe(true)
	})

	it("returns false for seedling profile when at limit", () => {
		expect(canCreateGoal(makeSeedlingProfile(), 3)).toBe(false)
	})

	it("returns false for seedling profile when above limit", () => {
		expect(canCreateGoal(makeSeedlingProfile(), 10)).toBe(false)
	})

	it("returns true for bloom profile regardless of count", () => {
		expect(canCreateGoal(makeBloomProfile(), 0)).toBe(true)
		expect(canCreateGoal(makeBloomProfile(), 100)).toBe(true)
		expect(canCreateGoal(makeBloomProfile(), 999999)).toBe(true)
	})
})

describe("getGoalsLimit", () => {
	it("returns 3 for null profile", () => {
		expect(getGoalsLimit(null)).toBe(3)
	})

	it("returns 3 for seedling profile", () => {
		expect(getGoalsLimit(makeSeedlingProfile())).toBe(3)
	})

	it("returns Infinity for bloom profile", () => {
		expect(getGoalsLimit(makeBloomProfile())).toBe(Infinity)
	})
})

describe("getRemainingGoals", () => {
	it("returns correct remaining for null profile", () => {
		expect(getRemainingGoals(null, 0)).toBe(3)
		expect(getRemainingGoals(null, 1)).toBe(2)
		expect(getRemainingGoals(null, 3)).toBe(0)
	})

	it("returns 0 when over limit (never negative)", () => {
		expect(getRemainingGoals(null, 5)).toBe(0)
	})

	it("returns Infinity for bloom profile", () => {
		expect(getRemainingGoals(makeBloomProfile(), 100)).toBe(Infinity)
	})

	it("returns correct remaining for seedling profile", () => {
		expect(getRemainingGoals(makeSeedlingProfile(), 1)).toBe(2)
	})
})

describe("getLimitMessage", () => {
	it("returns sign-up message for null profile", () => {
		const msg = getLimitMessage(null, 2)
		expect(msg).toBe("2/3 goals used. Sign up to track your progress!")
	})

	it("returns unlimited message for bloom profile", () => {
		const msg = getLimitMessage(makeBloomProfile(), 5)
		expect(msg).toBe("5 goals created. Unlimited with Bloom!")
	})

	it("returns usage count for seedling profile", () => {
		const msg = getLimitMessage(makeSeedlingProfile(), 1)
		expect(msg).toBe("1/3 goals used")
	})
})
