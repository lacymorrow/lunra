import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock services
const mockCreateSubscription = vi.fn()
const mockUpdateSubscription = vi.fn()
const mockGetSubscriptionByStripeId = vi.fn()
const mockUpdateUserProfile = vi.fn()

vi.mock("@/lib/services/subscriptions", () => ({
	createSubscription: (...args: any[]) => mockCreateSubscription(...args),
	updateSubscription: (...args: any[]) => mockUpdateSubscription(...args),
	getSubscriptionByStripeId: (...args: any[]) => mockGetSubscriptionByStripeId(...args),
	updateUserProfile: (...args: any[]) => mockUpdateUserProfile(...args),
}))

// Mock stripe
const mockConstructEvent = vi.fn()
const mockRetrieveSubscription = vi.fn()

vi.mock("@/lib/stripe", () => ({
	stripe: {
		webhooks: {
			constructEvent: (...args: any[]) => mockConstructEvent(...args),
		},
		subscriptions: {
			retrieve: (...args: any[]) => mockRetrieveSubscription(...args),
		},
	},
	PLANS: {
		seedling: { name: "Seedling", price: 0, priceId: "", goalsLimit: 3, features: [] },
		bloom: { name: "Bloom", price: 9, priceId: "price_bloom_test", goalsLimit: -1, features: [] },
	},
}))

// Mock next/headers
vi.mock("next/headers", () => ({
	headers: vi.fn().mockResolvedValue({
		get: (name: string) => {
			if (name === "stripe-signature") return "test_sig"
			return null
		},
	}),
}))

// Set env vars before import
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret")

import { POST } from "@/app/api/stripe/webhook/route"
import { NextRequest } from "next/server"

function makeRequest(body: string): NextRequest {
	return new NextRequest("http://localhost:3000/api/stripe/webhook", {
		method: "POST",
		body,
		headers: {
			"stripe-signature": "test_sig",
		},
	})
}

describe("Stripe Webhook", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("returns 400 for invalid signature", async () => {
		mockConstructEvent.mockImplementation(() => {
			throw new Error("Invalid signature")
		})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toBe("Invalid signature")
	})

	it("handles checkout.session.completed event", async () => {
		const mockSubscription = {
			id: "sub_123",
			status: "active",
			current_period_start: Math.floor(Date.now() / 1000),
			current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
			cancel_at_period_end: false,
		}

		mockConstructEvent.mockReturnValue({
			type: "checkout.session.completed",
			data: {
				object: {
					mode: "subscription",
					subscription: "sub_123",
					customer: "cus_123",
					metadata: { userId: "user-1", planId: "bloom" },
				},
			},
		})

		mockRetrieveSubscription.mockResolvedValue(mockSubscription)
		mockCreateSubscription.mockResolvedValue({})
		mockUpdateUserProfile.mockResolvedValue({})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(200)
		const json = await res.json()
		expect(json.received).toBe(true)

		expect(mockCreateSubscription).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: "user-1",
				stripe_customer_id: "cus_123",
				stripe_subscription_id: "sub_123",
				plan_id: "bloom",
			})
		)

		expect(mockUpdateUserProfile).toHaveBeenCalledWith("user-1", {
			plan_id: "bloom",
			goals_limit: -1,
		})
	})

	it("handles customer.subscription.updated event", async () => {
		mockConstructEvent.mockReturnValue({
			type: "customer.subscription.updated",
			data: {
				object: {
					id: "sub_123",
					status: "active",
					current_period_start: Math.floor(Date.now() / 1000),
					current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
					cancel_at_period_end: false,
					items: {
						data: [{ price: { id: "price_bloom_test" } }],
					},
				},
			},
		})

		mockGetSubscriptionByStripeId.mockResolvedValue({
			user_id: "user-1",
		})
		mockUpdateSubscription.mockResolvedValue({})
		mockUpdateUserProfile.mockResolvedValue({})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockUpdateSubscription).toHaveBeenCalled()
		expect(mockUpdateUserProfile).toHaveBeenCalledWith("user-1", {
			plan_id: "bloom",
			goals_limit: -1,
		})
	})

	it("handles customer.subscription.deleted event", async () => {
		mockConstructEvent.mockReturnValue({
			type: "customer.subscription.deleted",
			data: {
				object: { id: "sub_123" },
			},
		})

		mockGetSubscriptionByStripeId.mockResolvedValue({
			user_id: "user-1",
		})
		mockUpdateSubscription.mockResolvedValue({})
		mockUpdateUserProfile.mockResolvedValue({})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockUpdateSubscription).toHaveBeenCalledWith("user-1", {
			status: "canceled",
		})
		expect(mockUpdateUserProfile).toHaveBeenCalledWith("user-1", {
			plan_id: "seedling",
			goals_limit: 3,
		})
	})

	it("handles invoice.payment_failed event", async () => {
		mockConstructEvent.mockReturnValue({
			type: "invoice.payment_failed",
			data: {
				object: { subscription: "sub_123" },
			},
		})

		mockGetSubscriptionByStripeId.mockResolvedValue({
			user_id: "user-1",
		})
		mockUpdateSubscription.mockResolvedValue({})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockUpdateSubscription).toHaveBeenCalledWith("user-1", {
			status: "past_due",
		})
	})

	it("handles unrecognized event types gracefully", async () => {
		mockConstructEvent.mockReturnValue({
			type: "some.unknown.event",
			data: { object: {} },
		})

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(200)
		const json = await res.json()
		expect(json.received).toBe(true)
	})

	it("returns 500 when event processing throws", async () => {
		mockConstructEvent.mockReturnValue({
			type: "checkout.session.completed",
			data: {
				object: {
					mode: "subscription",
					subscription: "sub_123",
					customer: "cus_123",
					metadata: { userId: "user-1", planId: "bloom" },
				},
			},
		})

		mockRetrieveSubscription.mockRejectedValue(new Error("Stripe API down"))

		const req = makeRequest("{}")
		const res = await POST(req)

		expect(res.status).toBe(500)
		const json = await res.json()
		expect(json.error).toBe("Webhook processing failed")
	})
})
