import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"

const mockPush = vi.fn()
let mockPathname = "/dashboard"

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => mockPathname,
}))

const mockUseAuth = vi.fn()
vi.mock("@/contexts/auth-context", () => ({
	useAuth: () => mockUseAuth(),
}))

import { AuthGuard } from "@/components/auth-guard"

describe("AuthGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockPathname = "/dashboard"
	})

	it("shows loading state when auth is loading", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: true })

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>
		)

		expect(screen.getByText("Loading...")).toBeInTheDocument()
		expect(screen.queryByText("Protected Content")).not.toBeInTheDocument()
	})

	it("renders children when user is authenticated", () => {
		mockUseAuth.mockReturnValue({ user: { id: "1" }, isLoading: false })

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>
		)

		expect(screen.getByText("Protected Content")).toBeInTheDocument()
	})

	it("redirects to signin when not authenticated on protected route", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/dashboard"

		render(
			<AuthGuard>
				<div>Protected Content</div>
			</AuthGuard>
		)

		expect(mockPush).toHaveBeenCalledWith("/auth/signin")
	})

	it("does not redirect on public route /", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/"

		render(
			<AuthGuard>
				<div>Public Content</div>
			</AuthGuard>
		)

		expect(mockPush).not.toHaveBeenCalled()
		expect(screen.getByText("Public Content")).toBeInTheDocument()
	})

	it("does not redirect on /auth/signin", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/auth/signin"

		render(
			<AuthGuard>
				<div>Sign In Page</div>
			</AuthGuard>
		)

		expect(mockPush).not.toHaveBeenCalled()
	})

	it("does not redirect on /auth/signup", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/auth/signup"

		render(
			<AuthGuard>
				<div>Sign Up Page</div>
			</AuthGuard>
		)

		expect(mockPush).not.toHaveBeenCalled()
	})

	it("does not redirect on /auth/forgot-password", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/auth/forgot-password"

		render(
			<AuthGuard>
				<div>Forgot Password</div>
			</AuthGuard>
		)

		expect(mockPush).not.toHaveBeenCalled()
	})

	it("does not redirect on /auth/update-password", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
		mockPathname = "/auth/update-password"

		render(
			<AuthGuard>
				<div>Update Password</div>
			</AuthGuard>
		)

		expect(mockPush).not.toHaveBeenCalled()
	})
})
