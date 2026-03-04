import { describe, it, expect } from "vitest"
import { PLANS, getPlanById, isValidPlanId } from "@/lib/stripe-config"

describe("PLANS", () => {
	it("has seedling and bloom plans", () => {
		expect(PLANS).toHaveProperty("seedling")
		expect(PLANS).toHaveProperty("bloom")
	})

	it("seedling plan is free with 3 goals", () => {
		expect(PLANS.seedling.price).toBe(0)
		expect(PLANS.seedling.goalsLimit).toBe(3)
		expect(PLANS.seedling.name).toBe("Seedling")
	})

	it("bloom plan costs $9 with unlimited goals", () => {
		expect(PLANS.bloom.price).toBe(9)
		expect(PLANS.bloom.goalsLimit).toBe(-1)
		expect(PLANS.bloom.name).toBe("Bloom")
	})

	it("seedling has expected features", () => {
		expect(PLANS.seedling.features).toContain("3 cherished goals")
		expect(PLANS.seedling.features).toContain("gentle AI guidance")
	})

	it("bloom has expected features", () => {
		expect(PLANS.bloom.features).toContain("unlimited aspirations")
		expect(PLANS.bloom.features).toContain("advanced AI mentorship")
	})
})

describe("getPlanById", () => {
	it("returns seedling plan for valid ID", () => {
		const plan = getPlanById("seedling")
		expect(plan).not.toBeNull()
		expect(plan!.name).toBe("Seedling")
	})

	it("returns bloom plan for valid ID", () => {
		const plan = getPlanById("bloom")
		expect(plan).not.toBeNull()
		expect(plan!.name).toBe("Bloom")
	})

	it("returns null for invalid ID", () => {
		expect(getPlanById("invalid")).toBeNull()
		expect(getPlanById("")).toBeNull()
		expect(getPlanById("premium")).toBeNull()
	})
})

describe("isValidPlanId", () => {
	it("returns true for valid plan IDs", () => {
		expect(isValidPlanId("seedling")).toBe(true)
		expect(isValidPlanId("bloom")).toBe(true)
	})

	it("returns false for invalid plan IDs", () => {
		expect(isValidPlanId("invalid")).toBe(false)
		expect(isValidPlanId("")).toBe(false)
		expect(isValidPlanId("premium")).toBe(false)
		expect(isValidPlanId("SEEDLING")).toBe(false)
	})
})
