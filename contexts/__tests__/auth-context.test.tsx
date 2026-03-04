import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import React from "react"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	usePathname: () => "/",
}))

// Mock supabase
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()
const mockResetPasswordForEmail = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock("@/lib/supabase", () => ({
	supabase: () => ({
		auth: {
			signInWithPassword: mockSignInWithPassword,
			signUp: mockSignUp,
			signOut: mockSignOut,
			getSession: mockGetSession,
			getUser: mockGetUser,
			resetPasswordForEmail: mockResetPasswordForEmail,
			onAuthStateChange: mockOnAuthStateChange,
		},
	}),
}))

// Mock subscription client
vi.mock("@/lib/services/subscriptions-client", () => ({
	getUserProfileClient: vi.fn().mockResolvedValue(null),
	getUserSubscriptionClient: vi.fn().mockResolvedValue(null),
}))

import { AuthProvider, useAuth } from "@/contexts/auth-context"

describe("AuthContext", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockGetSession.mockResolvedValue({ data: { session: null } })
		mockOnAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } },
		})
	})

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<AuthProvider>{children}</AuthProvider>
	)

	it("throws when useAuth is used outside provider", () => {
		expect(() => {
			renderHook(() => useAuth())
		}).toThrow("useAuth must be used within an AuthProvider")
	})

	it("provides initial loading state", async () => {
		const { result } = renderHook(() => useAuth(), { wrapper })

		// Initially loading
		expect(result.current.isLoading).toBe(true)

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})
	})

	it("provides null user and session initially", async () => {
		const { result } = renderHook(() => useAuth(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		expect(result.current.user).toBeNull()
		expect(result.current.session).toBeNull()
		expect(result.current.userProfile).toBeNull()
		expect(result.current.userSubscription).toBeNull()
	})

	it("signIn calls supabase signInWithPassword", async () => {
		mockSignInWithPassword.mockResolvedValue({ error: null })

		const { result } = renderHook(() => useAuth(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		await act(async () => {
			const { error } = await result.current.signIn("test@test.com", "password")
			expect(error).toBeNull()
		})

		expect(mockSignInWithPassword).toHaveBeenCalledWith({
			email: "test@test.com",
			password: "password",
		})
	})

	it("signUp calls supabase signUp", async () => {
		mockSignUp.mockResolvedValue({ data: { user: { id: "1" } }, error: null })

		const { result } = renderHook(() => useAuth(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		await act(async () => {
			const { data, error } = await result.current.signUp("test@test.com", "password")
			expect(error).toBeNull()
			expect(data.user.id).toBe("1")
		})

		expect(mockSignUp).toHaveBeenCalledWith({
			email: "test@test.com",
			password: "password",
		})
	})

	it("signOut calls supabase signOut", async () => {
		mockSignOut.mockResolvedValue({})

		const { result } = renderHook(() => useAuth(), { wrapper })

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false)
		})

		await act(async () => {
			await result.current.signOut()
		})

		expect(mockSignOut).toHaveBeenCalled()
	})

	it("sets up auth state listener on mount", () => {
		renderHook(() => useAuth(), { wrapper })
		expect(mockOnAuthStateChange).toHaveBeenCalled()
	})

	it("cleans up auth listener on unmount", () => {
		const unsubscribe = vi.fn()
		mockOnAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe } },
		})

		const { unmount } = renderHook(() => useAuth(), { wrapper })
		unmount()

		expect(unsubscribe).toHaveBeenCalled()
	})
})
