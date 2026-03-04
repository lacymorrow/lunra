import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}))

const mockToast = vi.fn()
vi.mock("@/hooks/use-toast", () => ({
	useToast: () => ({ toast: mockToast }),
}))

const mockUseAuth = vi.fn()
vi.mock("@/contexts/auth-context", () => ({
	useAuth: () => mockUseAuth(),
}))

// Mock the Button component
vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, disabled, ...props }: any) => (
		<button onClick={onClick} disabled={disabled} {...props}>
			{children}
		</button>
	),
}))

import { PricingButton } from "@/components/pricing-button"

describe("PricingButton", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })
	})

	it("renders children text", () => {
		render(<PricingButton planId="seedling">Get Started</PricingButton>)
		expect(screen.getByText("Get Started")).toBeInTheDocument()
	})

	it("redirects to signup when no user", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: false })

		render(<PricingButton planId="seedling">Get Started</PricingButton>)
		fireEvent.click(screen.getByText("Get Started"))

		expect(mockPush).toHaveBeenCalledWith("/auth/signup")
	})

	it("redirects to dashboard for seedling plan when authenticated", () => {
		mockUseAuth.mockReturnValue({ user: { id: "1" }, isLoading: false })

		render(<PricingButton planId="seedling">Get Started Free</PricingButton>)
		fireEvent.click(screen.getByText("Get Started Free"))

		expect(mockPush).toHaveBeenCalledWith("/dashboard")
	})

	it("is disabled while loading", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: true })

		render(<PricingButton planId="bloom">Upgrade</PricingButton>)

		expect(screen.getByText("Upgrade").closest("button")).toBeDisabled()
	})

	it("does nothing when clicked while loading", () => {
		mockUseAuth.mockReturnValue({ user: null, isLoading: true })

		render(<PricingButton planId="bloom">Upgrade</PricingButton>)
		fireEvent.click(screen.getByText("Upgrade"))

		expect(mockPush).not.toHaveBeenCalled()
	})

	it("shows toast error when Stripe not loaded for bloom plan", () => {
		mockUseAuth.mockReturnValue({ user: { id: "1" }, isLoading: false })
		// window.Stripe is undefined by default in test env

		render(<PricingButton planId="bloom">Upgrade</PricingButton>)
		fireEvent.click(screen.getByText("Upgrade"))

		expect(mockToast).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Error",
				variant: "destructive",
			})
		)
	})
})
