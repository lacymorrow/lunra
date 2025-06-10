import { createGoal, deleteGoal, getGoalById, getGoals, updateGoal } from "@/lib/services/goals"
import type { SavedGoal } from "@/types"
import { convertDatabaseToLocalStorage } from "@/types/database"

// Local storage keys
const GOALS_KEY = "savedGoals"

// Helper functions for localStorage
function getLocalGoals(): SavedGoal[] {
	if (typeof window === "undefined") return []

	const savedGoals = localStorage.getItem(GOALS_KEY)
	return savedGoals ? JSON.parse(savedGoals) : []
}

function setLocalGoals(goals: SavedGoal[]): void {
	if (typeof window === "undefined") return
	localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

function getLocalGoalById(id: number): SavedGoal | null {
	const goals = getLocalGoals()
	return goals.find((goal) => goal.id === id) || null
}

function createLocalGoal(goal: Omit<SavedGoal, "id" | "createdAt">): SavedGoal {
	const goals = getLocalGoals()

	// Generate a new ID (simple implementation)
	const newId = goals.length > 0 ? Math.max(...goals.map((g) => g.id)) + 1 : 1

	const newGoal: SavedGoal = {
		...goal,
		id: newId,
		createdAt: new Date().toISOString(),
	}

	goals.push(newGoal)
	setLocalGoals(goals)
	return newGoal
}

function updateLocalGoal(id: number, goalData: Partial<SavedGoal>): SavedGoal | null {
	const goals = getLocalGoals()
	const index = goals.findIndex((goal) => goal.id === id)

	if (index === -1) return null

	goals[index] = { ...goals[index], ...goalData }
	setLocalGoals(goals)
	return goals[index]
}

function deleteLocalGoal(id: number): void {
	const goals = getLocalGoals()
	const filteredGoals = goals.filter((goal) => goal.id !== id)
	setLocalGoals(filteredGoals)
}

// The main data manager class
export class GoalDataManager {
	private userId: string | null = null

	constructor(userId?: string) {
		this.userId = userId || null
	}

	setUserId(userId: string | null) {
		this.userId = userId
	}

	get isAuthenticated(): boolean {
		return !!this.userId
	}

	// Sync local goals to database when user logs in
	async syncLocalGoalsToDatabase(): Promise<{
		synced: number;
		skipped: number;
		errors: string[];
		clearedLocal: boolean;
	}> {
		if (!this.isAuthenticated) {
			return { synced: 0, skipped: 0, errors: [], clearedLocal: false }
		}

		const localGoals = getLocalGoals()
		if (localGoals.length === 0) {
			return { synced: 0, skipped: 0, errors: [], clearedLocal: false }
		}

		console.log(`🔄 Starting sync of ${localGoals.length} local goals to database`)

		try {
			// Get existing database goals to avoid duplicates
			const dbGoals = await getGoals(this.userId!)
			console.log(`📊 Found ${dbGoals.length} existing goals in database`)

			// Create a comprehensive duplicate detection system
			const dbGoalSignatures = new Set(
				dbGoals.map(g => `${g.title.toLowerCase().trim()}|${g.description?.toLowerCase().trim() || ''}`)
			)

			let synced = 0
			let skipped = 0
			const errors: string[] = []

			// Process each local goal
			for (const [index, localGoal] of localGoals.entries()) {
				const signature = `${localGoal.title.toLowerCase().trim()}|${(localGoal.description || '').toLowerCase().trim()}`

				if (dbGoalSignatures.has(signature)) {
					console.log(`⏭️  Skipping duplicate goal: "${localGoal.title}"`)
					skipped++
					continue
				}

				try {
					console.log(`📤 Syncing goal ${index + 1}/${localGoals.length}: "${localGoal.title}"`)
					await createGoal(localGoal, this.userId!)
					synced++
					console.log(`✅ Successfully synced: "${localGoal.title}"`)
				} catch (error) {
					const errorMsg = `Failed to sync "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					console.error(`❌ ${errorMsg}`)
					errors.push(errorMsg)
				}
			}

			// Clear local storage only if sync was successful for all non-duplicate goals
			const shouldClearLocal = errors.length === 0 && (synced > 0 || skipped === localGoals.length)
			if (shouldClearLocal) {
				localStorage.removeItem(GOALS_KEY)
				console.log(`🧹 Cleared local storage after successful sync`)
			}

			console.log(`🎉 Sync complete: ${synced} synced, ${skipped} skipped, ${errors.length} errors`)

			return {
				synced,
				skipped,
				errors,
				clearedLocal: shouldClearLocal
			}
		} catch (error) {
			const errorMsg = `Database sync failed: ${error instanceof Error ? error.message : String(error)}`
			console.error(`💥 ${errorMsg}`)
			return {
				synced: 0,
				skipped: 0,
				errors: [errorMsg],
				clearedLocal: false
			}
		}
	}

	// Core CRUD operations that work with both localStorage and database
	async getGoals(): Promise<SavedGoal[]> {
		if (this.isAuthenticated) {
			try {
				const dbGoals = await getGoals(this.userId!)
				return dbGoals.map(convertDatabaseToLocalStorage)
			} catch (error) {
				console.error("Error fetching goals from database:", error)
				return getLocalGoals() // Fallback to localStorage
			}
		} else {
			return getLocalGoals()
		}
	}

	async getGoalById(id: number | string): Promise<SavedGoal | null> {
		if (this.isAuthenticated) {
			try {
				// If it's a number, it's a localStorage ID
				if (typeof id === "number") {
					// Try to find a matching goal in the database by title
					const localGoal = getLocalGoalById(id)
					if (!localGoal) return null

					const dbGoals = await getGoals(this.userId!)
					const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

					if (matchingGoal) {
						return convertDatabaseToLocalStorage(matchingGoal)
					}

					// If no match in database, return the local goal
					return localGoal
				}

				// If it's a string, it's a database UUID
				const dbGoal = await getGoalById(id as string, this.userId!)
				return dbGoal ? convertDatabaseToLocalStorage(dbGoal) : null
			} catch (error) {
				console.error("Error fetching goal from database:", error)

				// If it's a number ID, try localStorage
				if (typeof id === "number") {
					return getLocalGoalById(id)
				}
				return null
			}
		} else {
			// For unauthenticated users, only number IDs are valid
			if (typeof id === "number") {
				return getLocalGoalById(id)
			}
			return null
		}
	}

	async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal> {
		if (this.isAuthenticated) {
			try {
				const dbGoal = await createGoal(goalData, this.userId!)
				return convertDatabaseToLocalStorage(dbGoal!)
			} catch (error) {
				console.error("Error creating goal in database:", error)
				// Fallback to localStorage
				return createLocalGoal(goalData)
			}
		} else {
			return createLocalGoal(goalData)
		}
	}

	async updateGoal(id: number | string, goalData: Partial<SavedGoal>): Promise<SavedGoal | null> {
		if (this.isAuthenticated) {
			try {
				// If it's a number, it's a localStorage ID
				if (typeof id === "number") {
					// Try to find a matching goal in the database by title
					const localGoal = getLocalGoalById(id)
					if (!localGoal) return null

					const dbGoals = await getGoals(this.userId!)
					const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

					if (matchingGoal) {
						// Update the database goal
						const updatedDbGoal = await updateGoal(
							matchingGoal.id as string,
							goalData,
							this.userId!
						)

						// Get the full goal with milestones
						if (updatedDbGoal) {
							const fullGoal = await getGoalById(updatedDbGoal.id, this.userId!)
							return fullGoal ? convertDatabaseToLocalStorage(fullGoal) : null
						}
						return null
					}

					// If no match in database, update the local goal
					return updateLocalGoal(id, goalData)
				}

				// If it's a string, it's a database UUID
				const updatedDbGoal = await updateGoal(id as string, goalData, this.userId!)

				// Get the full goal with milestones
				if (updatedDbGoal) {
					const fullGoal = await getGoalById(updatedDbGoal.id, this.userId!)
					return fullGoal ? convertDatabaseToLocalStorage(fullGoal) : null
				}
				return null
			} catch (error) {
				console.error("Error updating goal in database:", error)

				// If it's a number ID, try localStorage
				if (typeof id === "number") {
					return updateLocalGoal(id, goalData)
				}
				return null
			}
		} else {
			// For unauthenticated users, only number IDs are valid
			if (typeof id === "number") {
				return updateLocalGoal(id, goalData)
			}
			return null
		}
	}

	async deleteGoal(id: number | string): Promise<boolean> {
		if (this.isAuthenticated) {
			try {
				// If it's a number, it's a localStorage ID
				if (typeof id === "number") {
					// Try to find a matching goal in the database by title
					const localGoal = getLocalGoalById(id)
					if (!localGoal) return false

					const dbGoals = await getGoals(this.userId!)
					const matchingGoal = dbGoals.find((g) => g.title === localGoal.title)

					if (matchingGoal) {
						// Delete the database goal
						await deleteGoal(matchingGoal.id as string, this.userId!)
					}

					// Always delete the local goal
					deleteLocalGoal(id)
					return true
				}

				// If it's a string, it's a database UUID
				await deleteGoal(id as string, this.userId!)
				return true
			} catch (error) {
				console.error("Error deleting goal from database:", error)

				// If it's a number ID, try localStorage
				if (typeof id === "number") {
					deleteLocalGoal(id)
					return true
				}
				return false
			}
		} else {
			// For unauthenticated users, only number IDs are valid
			if (typeof id === "number") {
				deleteLocalGoal(id)
				return true
			}
			return false
		}
	}

	// Milestone operations
	async markMilestoneComplete(goalId: number, milestoneIndex: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal || !goal.milestones || !goal.milestones[milestoneIndex]) return

		// Update the milestone status
		const updatedMilestones = [...goal.milestones]
		updatedMilestones[milestoneIndex] = {
			...updatedMilestones[milestoneIndex],
			status: "completed",
			progress: 100,
		}

		// Find the next pending milestone and set it to 'in-progress'
		const nextPendingIndex = updatedMilestones.findIndex((m, index) => index > milestoneIndex && m.status === "pending")

		if (nextPendingIndex !== -1) {
			updatedMilestones[nextPendingIndex] = {
				...updatedMilestones[nextPendingIndex],
				status: "in-progress",
				progress: 10, // Give it a small starting progress
			}
		}

		// Calculate new progress
		const totalMilestones = updatedMilestones.length
		const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
		const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

		// Update the goal
		await this.updateGoal(goalId, {
			milestones: updatedMilestones,
			progress: newProgress,
			status: newProgress === 100 ? "completed" : newProgress >= 50 ? "on-track" : "in-progress",
		})
	}

	async undoMilestoneComplete(goalId: number, milestoneIndex: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal || !goal.milestones || !goal.milestones[milestoneIndex]) return

		const updatedMilestones = [...goal.milestones]

		// Find any 'in-progress' milestone that isn't the one we're undoing
		// and set it back to 'pending'. This handles the case where completing
		// the milestone at `milestoneIndex` had automatically set the next one to 'in-progress'.
		const currentlyActiveMilestoneIndex = updatedMilestones.findIndex(
			(m, index) => m.status === "in-progress" && index !== milestoneIndex,
		)

		if (currentlyActiveMilestoneIndex !== -1) {
			updatedMilestones[currentlyActiveMilestoneIndex] = {
				...updatedMilestones[currentlyActiveMilestoneIndex],
				status: "pending",
				progress: 0,
			}
		}

		// Now, set the undone milestone back to 'in-progress'
		updatedMilestones[milestoneIndex] = {
			...updatedMilestones[milestoneIndex],
			status: "in-progress",
			progress: 50, // Reset to a standard 'in-progress' value
		}

		// Calculate new progress
		const totalMilestones = updatedMilestones.length
		const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
		const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

		// Update the goal
		await this.updateGoal(goalId, {
			milestones: updatedMilestones,
			progress: newProgress,
			status: newProgress === 0 ? "not-started" : newProgress < 50 ? "behind" : "in-progress",
		})
	}

	async adjustTimeline(goalId: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal) return

		// This function would typically open a modal or navigate to a page
		// where the user can adjust the timeline of their goal
		// For now, we'll just log that this functionality is not yet implemented
		console.log("Adjust Timeline functionality not yet implemented for goal:", goalId)
	}
}

// Create a singleton instance
let dataManagerInstance: GoalDataManager | null = null

export function getDataManager(userId?: string): GoalDataManager {
	if (!dataManagerInstance) {
		dataManagerInstance = new GoalDataManager(userId)
	} else if (userId) {
		dataManagerInstance.setUserId(userId)
	}

	return dataManagerInstance
}
