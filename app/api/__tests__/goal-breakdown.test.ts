import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the AI SDK
const mockStreamText = vi.fn()
vi.mock("ai", () => ({
	streamText: (...args: any[]) => mockStreamText(...args),
}))

vi.mock("@ai-sdk/openai", () => ({
	openai: vi.fn(() => "mocked-model"),
}))

import { POST } from "@/app/api/goal-breakdown/route"

function makeRequest(body: object): Request {
	return new Request("http://localhost:3000/api/goal-breakdown", {
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

	it("returns 500 on error", async () => {
		mockStreamText.mockImplementation(() => {
			throw new Error("OpenAI API error")
		})

		const req = makeRequest({ messages: [{ role: "user", content: "test" }] })
		const res = await POST(req)

		expect(res.status).toBe(500)
		const json = await res.json()
		expect(json.error).toBe("Failed to process request")
		expect(json.details).toBe("OpenAI API error")
		expect(json.timestamp).toBeDefined()
	})

	it("handles missing messages gracefully", async () => {
		// When req.json() fails to have messages, streamText should still be called
		// but the messages field will be undefined
		mockStreamText.mockImplementation(() => {
			throw new Error("messages is required")
		})

		const req = makeRequest({})
		const res = await POST(req)

		expect(res.status).toBe(500)
	})
})
