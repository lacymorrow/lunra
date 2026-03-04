import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock services
const mockGetUserProfile = vi.fn()
const mockCreateUserProfile = vi.fn()
const mockUpdateUserProfile = vi.fn()

vi.mock("@/lib/services/subscriptions", () => ({
	getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
	createUserProfile: (...args: any[]) => mockCreateUserProfile(...args),
	updateUserProfile: (...args: any[]) => mockUpdateUserProfile(...args),
}))

// Mock stripe
const mockCustomersCreate = vi.fn()
const mockCheckoutSessionsCreate = vi.fn()

vi.mock("@/lib/stripe", () => ({
	stripe: {
		customers: {
			create: (...args: any[]) => mockCustomersCreate(...args),
		},
		checkout: {
			sessions: {
				create: (...args: any[]) => mockCheckoutSessionsCreate(...args),
			},
		},
	},
	PLANS: {
		seedling: { name: "Seedling", price: 0, priceId: "", goalsLimit: 3, features: [] },
		bloom: { name: "Bloom", price: 9, priceId: "price_bloom_test", goalsLimit: -1, features: [] },
	},
	isValidPlanId: (id: string) => id === "seedling" || id === "bloom",
}))

// Mock supabase-server
const mockGetUser = vi.fn()
vi.mock("@/lib/supabase-server", () => ({
	createClientServerWithAuth: () => ({
		auth: {
			getUser: () => mockGetUser(),
		},
	}),
}))

// Stub server-only
vi.mock("server-only", () => ({}))

import { POST } from "@/app/api/stripe/create-checkout-session/route"
import { NextRequest } from "next/server"

function makeRequest(body: object): NextRequest {
	return new NextRequest("http://localhost:3000/api/stripe/create-checkout-session", {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"Content-Type": "application/json",
		},
	})
}

describe("Create Checkout Session API", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns 400 for invalid plan ID", async () => {
		const req = makeRequest({ planId: "invalid" })
		const res = await POST(req)

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toBe("Invalid plan ID")
	})

	it("returns 400 for missing plan ID", async () => {
		const req = makeRequest({})
		const res = await POST(req)

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toBe("Invalid plan ID")
	})

	it("returns 400 for seedling plan (free, no checkout needed)", async () => {
		const req = makeRequest({ planId: "seedling" })
		const res = await POST(req)

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toBe("Free plan does not require checkout")
	})

	it("returns 401 when auth error occurs", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: { message: "Invalid token" },
		})

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(401)
		const json = await res.json()
		expect(json.error).toBe("Unauthorized")
	})

	it("returns 401 when no user found", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: null },
			error: null,
		})

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(401)
		const json = await res.json()
		expect(json.error).toBe("Unauthorized")
	})

	it("creates checkout session for authenticated user with existing profile", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1", email: "test@test.com" } },
			error: null,
		})

		mockGetUserProfile.mockResolvedValue({
			id: "profile-1",
			user_id: "user-1",
			stripe_customer_id: "cus_existing",
			full_name: "Test User",
		})

		mockCheckoutSessionsCreate.mockResolvedValue({
			id: "cs_test_123",
			url: "https://checkout.stripe.com/test",
		})

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(200)
		const json = await res.json()
		expect(json.sessionId).toBe("cs_test_123")
		expect(json.url).toBe("https://checkout.stripe.com/test")

		// Should not create a new customer since one exists
		expect(mockCustomersCreate).not.toHaveBeenCalled()
	})

	it("creates Stripe customer when profile has no stripe_customer_id", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1", email: "test@test.com" } },
			error: null,
		})

		mockGetUserProfile.mockResolvedValue({
			id: "profile-1",
			user_id: "user-1",
			stripe_customer_id: null,
			full_name: "Test User",
		})

		mockCustomersCreate.mockResolvedValue({ id: "cus_new_123", email: "test@test.com" })
		mockUpdateUserProfile.mockResolvedValue({})
		mockCheckoutSessionsCreate.mockResolvedValue({
			id: "cs_test_456",
			url: "https://checkout.stripe.com/test2",
		})

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockCustomersCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "test@test.com",
				metadata: { userId: "user-1" },
			})
		)
		expect(mockUpdateUserProfile).toHaveBeenCalledWith("user-1", {
			stripe_customer_id: "cus_new_123",
		})
	})

	it("creates user profile when none exists", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1", email: "test@test.com", user_metadata: { full_name: "Test" } } },
			error: null,
		})

		mockGetUserProfile.mockResolvedValue(null)
		mockCreateUserProfile.mockResolvedValue({
			id: "profile-new",
			user_id: "user-1",
			stripe_customer_id: null,
			full_name: "Test",
		})

		mockCustomersCreate.mockResolvedValue({ id: "cus_new" })
		mockUpdateUserProfile.mockResolvedValue({})
		mockCheckoutSessionsCreate.mockResolvedValue({ id: "cs_test", url: "https://stripe.com" })

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockCreateUserProfile).toHaveBeenCalledWith("user-1", {
			full_name: "Test",
		})
	})

	it("returns 500 when profile creation fails", async () => {
		mockGetUser.mockResolvedValue({
			data: { user: { id: "user-1", email: "test@test.com" } },
			error: null,
		})

		mockGetUserProfile.mockResolvedValue(null)
		mockCreateUserProfile.mockResolvedValue(null)

		const req = makeRequest({ planId: "bloom" })
		const res = await POST(req)

		expect(res.status).toBe(500)
		const json = await res.json()
		expect(json.error).toBe("Failed to create user profile")
	})
})
