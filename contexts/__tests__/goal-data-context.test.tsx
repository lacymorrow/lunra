import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import React from "react"

// Mock auth context
const mockUser = { id: "user-1" }
const mockUserProfile = { plan_id: "seedling" }
vi.mock("@/contexts/auth-context", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		userProfile: null,
	})),
}))

// Mock data manager
const mockGetGoals = vi.fn().mockResolvedValue([])
const mockSyncLocalGoalsToDatabase = vi.fn().mockResolvedValue({
	synced: 0,
	skipped: 0,
	errors: [],
	clearedLocal: false,
})
const mockBidirectionalSync = vi.fn().mockResolvedValue({
	localToDbSynced: 0,
	dbToLocalSynced: 0,
	conflicts: 0,
	errors: [],
})

vi.mock("@/lib/data-manager", () => ({
	getDataManager: vi.fn(() => ({
		getGoals: mockGetGoals,
		syncLocalGoalsToDatabase: mockSyncLocalGoalsToDatabase,
		bidirectionalSync: mockBidirectionalSync,
		setUserData: vi.fn(),
		destroy: vi.fn(),
	})),
	cleanupDataManager: vi.fn(),
}))

import { GoalDataProvider, useGoalData } from "@/contexts/goal-data-context"
import { useAuth } from "@/contexts/auth-context"

describe("GoalDataContext", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
			user: null,
			userProfile: null,
		})
	})

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<GoalDataProvider>{children}</GoalDataProvider>
	)

	it("throws when useGoalData is used outside provider", () => {
		expect(() => {
			renderHook(() => useGoalData())
		}).toThrow("useGoalData must be used within a GoalDataProvider")
	})

	it("provides goals array and loading state", async () => {
		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.goals).toEqual([])
		expect(result.current.error).toBeNull()
	})

	it("refreshGoals fetches from data manager", async () => {
		const goals = [{ id: 1, title: "Test" }]
		mockGetGoals.mockResolvedValue(goals)

		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		await act(async () => {
			await result.current.refreshGoals()
		})

		expect(mockGetGoals).toHaveBeenCalled()
	})

	it("provides dataManager instance", async () => {
		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.dataManager).toBeDefined()
		expect(result.current.dataManager.getGoals).toBeDefined()
	})

	it("triggerManualSync does nothing for non-bloom users", async () => {
		;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
			user: mockUser,
			userProfile: { plan_id: "seedling" },
		})

		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		await act(async () => {
			await result.current.triggerManualSync()
		})

		expect(mockBidirectionalSync).not.toHaveBeenCalled()
	})

	it("triggerManualSync works for bloom users", async () => {
		;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
			user: mockUser,
			userProfile: { plan_id: "bloom" },
		})

		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		await act(async () => {
			await result.current.triggerManualSync()
		})

		expect(mockBidirectionalSync).toHaveBeenCalled()
	})

	it("provides syncStatus", async () => {
		const { result } = renderHook(() => useGoalData(), { wrapper })

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.syncStatus).toBeDefined()
		expect(result.current.syncStatus.isLoading).toBe(false)
	})
})
