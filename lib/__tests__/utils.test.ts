import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
	it("merges class names", () => {
		expect(cn("foo", "bar")).toBe("foo bar")
	})

	it("handles conditional classes", () => {
		expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
	})

	it("handles undefined and null", () => {
		expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
	})

	it("merges tailwind classes correctly", () => {
		expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
	})

	it("handles empty input", () => {
		expect(cn()).toBe("")
	})

	it("handles arrays", () => {
		expect(cn(["foo", "bar"])).toBe("foo bar")
	})

	it("deduplicates conflicting tailwind classes", () => {
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
	})
})
