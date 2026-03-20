import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock the AI SDK
const mockStreamText = vi.fn()
vi.mock("ai", () => ({
	streamText: (...args: any[]) => mockStreamText(...args),
}))

vi.mock("@ai-sdk/openai", () => ({
	openai: vi.fn(() => "mocked-model"),
}))

// Mock supabase-server to bypass auth
const mockGetUser = vi.fn()
vi.mock("@/lib/supabase-server", () => ({
	createClientServerWithAuth: () => ({
		auth: {
			getUser: mockGetUser,
		},
	}),
}))

import { POST } from "@/app/api/goal-breakdown/route"

function makeRequest(body: object): NextRequest {
	return new NextRequest("http://localhost:3000/api/goal-breakdown", {
		method: "POST",
		body: JSON.stringify(body),
		headers: {
			"Content-Type": "application/json",
		},
	})
}

describe("Goal Breakdown API", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		// Default: authenticated user
		mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null })
	})

	it("returns 401 for unauthenticated requests", async () => {
		mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "Not authenticated" } })

		const req = makeRequest({ messages: [{ role: "user", content: "test" }] })
		const res = await POST(req)

		expect(res.status).toBe(401)
	})

	it("returns streaming response for valid messages", async () => {
		const mockResponse = new Response("streamed data", { status: 200 })
		mockStreamText.mockReturnValue({
			toDataStreamResponse: () => mockResponse,
		})

		const req = makeRequest({
			messages: [{ role: "user", content: "I want to learn piano in 3 months" }],
		})

		const res = await POST(req)

		expect(res.status).toBe(200)
		expect(mockStreamText).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "mocked-model",
				system: expect.stringContaining("expert life coach"),
				messages: [{ role: "user", content: "I want to learn piano in 3 months" }],
			})
		)
	})

	it("passes system prompt with critical guidelines", async () => {
		const mockResponse = new Response("", { status: 200 })
		mockStreamText.mockReturnValue({
			toDataStreamResponse: () => mockResponse,
		})

		const req = makeRequest({ messages: [{ role: "user", content: "test" }] })
		await POST(req)

		const callArgs = mockStreamText.mock.calls[0][0]
		expect(callArgs.system).toContain("ASK ONLY ONE QUESTION AT A TIME")
		expect(callArgs.system).toContain("STRICTLY RESPECT THE USER'S TIMELINE")
		expect(callArgs.system).toContain("MULTIPLE TIMELINE DETECTION")
	})

	it("returns 400 for invalid messages format", async () => {
		const req = makeRequest({})
		const res = await POST(req)

		expect(res.status).toBe(400)
		const json = await res.json()
		expect(json.error).toBe("Invalid messages format")
	})

	it("returns 500 on error", async () => {
		mockStreamText.mockImplementation(() => {
			throw new Error("OpenAI API error")
		})

		const req = makeRequest({ messages: [{ role: "user", content: "test" }] })
		const res = await POST(req)

		expect(res.status).toBe(500)
		const json = await res.json()
		expect(json.error).toBe("Failed to process request")
	})
})
