import { createGoal, deleteGoal, getGoals, updateGoal } from "@/lib/services/goals"
import type { SavedGoal } from "@/types"
import type { DatabaseUserProfile } from "@/types/database"
import { convertDatabaseToLocalStorage } from "@/types/database"

// Local storage keys
const GOALS_KEY = "savedGoals"
const LAST_SYNC_KEY = "lastSyncTimestamp"
const GOAL_SIGNATURES_KEY = "goalSignatures" // Track goal signatures for duplicate prevention

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

// Generate unique signature for goal content (for duplicate detection)
function generateGoalSignature(goal: Omit<SavedGoal, "id" | "createdAt"> | SavedGoal): string {
	const normalized = {
		title: goal.title.toLowerCase().trim(),
		description: (goal.description || '').toLowerCase().trim(),
		timeline: (goal.timeline || '').toLowerCase().trim(),
		// Include milestone count and first few tasks for better uniqueness
		milestoneCount: goal.milestones?.length || 0,
		firstMilestones: goal.milestones?.slice(0, 3).map(m => m.task.toLowerCase().trim()).join('|') || ''
	}
	return `${normalized.title}|${normalized.description}|${normalized.timeline}|${normalized.milestoneCount}|${normalized.firstMilestones}`
}

// Manage goal signatures for duplicate detection
function getGoalSignatures(): Set<string> {
	if (typeof window === "undefined") return new Set()
	const signatures = localStorage.getItem(GOAL_SIGNATURES_KEY)
	return signatures ? new Set(JSON.parse(signatures)) : new Set()
}

function setGoalSignatures(signatures: Set<string>): void {
	if (typeof window === "undefined") return
	localStorage.setItem(GOAL_SIGNATURES_KEY, JSON.stringify([...signatures]))
}

function addGoalSignature(signature: string): void {
	const signatures = getGoalSignatures()
	signatures.add(signature)
	setGoalSignatures(signatures)
}

function removeGoalSignature(signature: string): void {
	const signatures = getGoalSignatures()
	signatures.delete(signature)
	setGoalSignatures(signatures)
}

// Clean up orphaned signatures (signatures without corresponding goals)
function cleanupOrphanedSignatures(): void {
	if (typeof window === "undefined") return

	const goals = getLocalGoals()
	const signatures = getGoalSignatures()
	const validSignatures = new Set(goals.map(g => generateGoalSignature(g)))

	let cleaned = 0
	for (const signature of signatures) {
		if (!validSignatures.has(signature)) {
			signatures.delete(signature)
			cleaned++
		}
	}

	if (cleaned > 0) {
		setGoalSignatures(signatures)
		console.log(`🧹 Cleaned up ${cleaned} orphaned goal signatures`)
	}
}

function getLocalGoalById(id: number): SavedGoal | null {
	const goals = getLocalGoals()
	return goals.find((goal) => goal.id === id) || null
}

function createLocalGoal(goal: Omit<SavedGoal, "id" | "createdAt">): SavedGoal {
	const goals = getLocalGoals()
	const signature = generateGoalSignature(goal)
	const signatures = getGoalSignatures()

	// Check for duplicate by signature
	if (signatures.has(signature)) {
		console.warn(`🚫 Duplicate goal detected, checking for existing goal: "${goal.title}"`)
		// Return existing goal with same signature
		const existingGoal = goals.find(g => generateGoalSignature(g) === signature)
		if (existingGoal) {
			console.log(`✅ Found existing goal with matching signature: "${existingGoal.title}"`)
			return existingGoal
		}

		// Handle inconsistent state: signature exists but no corresponding goal found
		console.warn(`🧹 Orphaned signature detected for "${goal.title}" - cleaning up and proceeding with creation`)
		removeGoalSignature(signature)
	}

	// Generate a new ID (simple implementation)
	const newId = goals.length > 0 ? Math.max(...goals.map((g) => g.id)) + 1 : 1

	const newGoal: SavedGoal = {
		...goal,
		id: newId,
		createdAt: new Date().toISOString(),
	}

	goals.push(newGoal)
	setLocalGoals(goals)
	addGoalSignature(signature)
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

function getLastSyncTimestamp(): string | null {
	if (typeof window === "undefined") return null
	return localStorage.getItem(LAST_SYNC_KEY)
}

function setLastSyncTimestamp(timestamp: string): void {
	if (typeof window === "undefined") return
	localStorage.setItem(LAST_SYNC_KEY, timestamp)
}

// The main data manager class
export class GoalDataManager {
	private userId: string | null = null
	private userProfile: DatabaseUserProfile | null = null
	private syncIntervalId: NodeJS.Timeout | null = null

	constructor(userId?: string, userProfile?: DatabaseUserProfile | null) {
		this.userId = userId || null
		this.userProfile = userProfile || null

		// Start auto-sync for paid users
		if (this.isPaidUser) {
			this.startAutoSync()
		}
	}

	setUserData(userId: string | null, userProfile?: DatabaseUserProfile | null) {
		this.userId = userId
		this.userProfile = userProfile || null

		// Manage auto-sync based on plan status
		if (this.isPaidUser) {
			this.startAutoSync()
		} else {
			this.stopAutoSync()
		}
	}

	get isAuthenticated(): boolean {
		return !!this.userId
	}

	get isPaidUser(): boolean {
		return this.isAuthenticated && this.userProfile?.plan_id === 'bloom'
	}

	get shouldSync(): boolean {
		return this.isPaidUser
	}

	private startAutoSync(): void {
		// Clear any existing interval
		this.stopAutoSync()

		// Sync every 30 seconds for paid users
		this.syncIntervalId = setInterval(async () => {
			try {
				await this.bidirectionalSync()
			} catch (error) {
				console.error("Auto-sync failed:", error)
			}
		}, 30000) // 30 seconds
	}

	private stopAutoSync(): void {
		if (this.syncIntervalId) {
			clearInterval(this.syncIntervalId)
			this.syncIntervalId = null
		}
	}

	// Bidirectional sync for paid users - syncs both ways
	async bidirectionalSync(): Promise<{
		localToDbSynced: number;
		dbToLocalSynced: number;
		conflicts: number;
		errors: string[];
		duplicatesSkipped: number;
	}> {
		if (!this.shouldSync) {
			return { localToDbSynced: 0, dbToLocalSynced: 0, conflicts: 0, errors: [], duplicatesSkipped: 0 }
		}

		console.log("🔄 Starting bidirectional sync for paid user")

		try {
			const result = {
				localToDbSynced: 0,
				dbToLocalSynced: 0,
				conflicts: 0,
				duplicatesSkipped: 0,
				errors: [] as string[]
			}

			// Get both local and database goals
			const localGoals = getLocalGoals()
			const dbGoals = await getGoals(this.userId!)
			const dbGoalsConverted = dbGoals.map(convertDatabaseToLocalStorage)

			// Create comprehensive maps for lookup by ID and signature
			const localGoalsMap = new Map(localGoals.map(g => [g.id, g]))
			const dbGoalsMap = new Map(dbGoalsConverted.map(g => [g.id, g]))

			// Create signature maps to detect content duplicates
			const localSignatureMap = new Map(localGoals.map(g => [generateGoalSignature(g), g]))
			const dbSignatureMap = new Map(dbGoalsConverted.map(g => [generateGoalSignature(g), g]))

			// Find goals that exist locally but not in database (sync up)
			for (const localGoal of localGoals) {
				const signature = generateGoalSignature(localGoal)

				// Check if goal already exists in database by ID or signature
				if (dbGoalsMap.has(localGoal.id) || dbSignatureMap.has(signature)) {
					console.log(`⏭️ Skipping sync of local goal (duplicate detected): "${localGoal.title}"`)
					result.duplicatesSkipped++
					continue
				}

				try {
					await createGoal(localGoal, this.userId!)
					result.localToDbSynced++
					console.log(`📤 Synced local goal to database: "${localGoal.title}"`)
				} catch (error) {
					const errorMsg = `Failed to sync local goal "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					result.errors.push(errorMsg)
					console.error(errorMsg)
				}
			}

			// Find goals that exist in database but not locally (sync down)
			for (const dbGoal of dbGoalsConverted) {
				const signature = generateGoalSignature(dbGoal)

				// Check if goal already exists locally by ID or signature
				if (localGoalsMap.has(dbGoal.id) || localSignatureMap.has(signature)) {
					console.log(`⏭️ Skipping sync of database goal (duplicate detected): "${dbGoal.title}"`)
					result.duplicatesSkipped++
					continue
				}

				try {
					const localGoals = getLocalGoals()
					localGoals.push(dbGoal)
					setLocalGoals(localGoals)
					addGoalSignature(signature)
					result.dbToLocalSynced++
					console.log(`📥 Synced database goal to local: "${dbGoal.title}"`)
				} catch (error) {
					const errorMsg = `Failed to sync database goal "${dbGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					result.errors.push(errorMsg)
					console.error(errorMsg)
				}
			}

			// Handle conflicts (goals with same ID but different data)
			for (const localGoal of localGoals) {
				const dbGoal = dbGoalsMap.get(localGoal.id)
				if (dbGoal && this.hasConflict(localGoal, dbGoal)) {
					try {
						// Use local version as source of truth for conflicts
						await updateGoal(dbGoal.id as string, localGoal, this.userId!)
						result.conflicts++
						console.log(`🔀 Resolved conflict for goal: "${localGoal.title}" (local version wins)`)
					} catch (error) {
						const errorMsg = `Failed to resolve conflict for "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
						result.errors.push(errorMsg)
						console.error(errorMsg)
					}
				}
			}

			// Update last sync timestamp
			setLastSyncTimestamp(new Date().toISOString())

			console.log(`✅ Bidirectional sync complete:`, result)
			return result

		} catch (error) {
			const errorMsg = `Bidirectional sync failed: ${error instanceof Error ? error.message : String(error)}`
			console.error(errorMsg)
			return {
				localToDbSynced: 0,
				dbToLocalSynced: 0,
				conflicts: 0,
				duplicatesSkipped: 0,
				errors: [errorMsg]
			}
		}
	}

	private hasConflict(localGoal: SavedGoal, dbGoal: SavedGoal): boolean {
		// Simple conflict detection - compare key fields
		return (
			localGoal.title !== dbGoal.title ||
			localGoal.description !== dbGoal.description ||
			localGoal.progress !== dbGoal.progress ||
			localGoal.status !== dbGoal.status ||
			JSON.stringify(localGoal.milestones) !== JSON.stringify(dbGoal.milestones)
		)
	}

	// Legacy sync method - now used for initial migration when signing up
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

		console.log(`🔄 Starting initial sync of ${localGoals.length} local goals to database`)

		try {
			// Get existing database goals to avoid duplicates
			const dbGoals = await getGoals(this.userId!)
			console.log(`📊 Found ${dbGoals.length} existing goals in database`)

			// Create a comprehensive duplicate detection system using enhanced signatures
			const dbGoalSignatures = new Set(
				dbGoals.map(g => generateGoalSignature(convertDatabaseToLocalStorage(g)))
			)

			let synced = 0
			let skipped = 0
			const errors: string[] = []

			// Process each local goal
			for (const [index, localGoal] of localGoals.entries()) {
				const signature = generateGoalSignature(localGoal)

				if (dbGoalSignatures.has(signature)) {
					console.log(`⏭️  Skipping duplicate goal: "${localGoal.title}"`)
					skipped++
					continue
				}

				try {
					console.log(`📤 Syncing goal ${index + 1}/${localGoals.length}: "${localGoal.title}"`)
					await createGoal(localGoal, this.userId!)
					dbGoalSignatures.add(signature) // Add to set to prevent duplicates within this sync
					synced++
					console.log(`✅ Successfully synced: "${localGoal.title}"`)
				} catch (error) {
					// Check if error indicates duplicate (e.g., database constraint violation)
					const errorMessage = error instanceof Error ? error.message : String(error)
					if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorMessage.includes('constraint')) {
						console.log(`⏭️  Database rejected duplicate goal: "${localGoal.title}"`)
						skipped++
					} else {
						const errorMsg = `Failed to sync "${localGoal.title}": ${errorMessage}`
						console.error(`❌ ${errorMsg}`)
						errors.push(errorMsg)
					}
				}
			}

			console.log(`🎉 Initial sync complete: ${synced} synced, ${skipped} skipped, ${errors.length} errors`)

			// For paid users, don't clear local storage - keep it for offline use
			// For free users, we don't sync to database anyway
			const clearedLocal = false

			return {
				synced,
				skipped,
				errors,
				clearedLocal
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

	// Core CRUD operations - all operations now use localStorage as primary storage
	async getGoals(): Promise<SavedGoal[]> {
		// Clean up orphaned signatures before returning goals
		cleanupOrphanedSignatures()

		// Always return from localStorage for immediate offline access
		return getLocalGoals()
	}

	async getGoalById(id: number | string): Promise<SavedGoal | null> {
		// For offline-first approach, always check localStorage first
		if (typeof id === "number") {
			return getLocalGoalById(id)
		}

		// If it's a database UUID, try to find it in local storage by matching properties
		const localGoals = getLocalGoals()
		const matchingGoal = localGoals.find(g => g.id?.toString() === id)
		return matchingGoal || null
	}

	async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal> {
		// Check for duplicates before creating
		const signature = generateGoalSignature(goalData)
		const signatures = getGoalSignatures()

		if (signatures.has(signature)) {
			console.warn(`🚫 Duplicate goal creation attempt detected: "${goalData.title}"`)
			// Return existing goal with same signature
			const existingGoals = getLocalGoals()
			const existingGoal = existingGoals.find(g => generateGoalSignature(g) === signature)
			if (existingGoal) {
				console.log(`🔄 Returning existing goal: "${existingGoal.title}"`)
				return existingGoal
			}
		}

		// Always create in localStorage first for immediate offline access
		const localGoal = createLocalGoal(goalData)

		// If user is paid, also sync to database in background
		if (this.shouldSync) {
			try {
				await createGoal(localGoal, this.userId!)
				console.log(`🔄 Background sync: Created goal "${localGoal.title}" in database`)
			} catch (error) {
				// Check if it's a duplicate error
				const errorMessage = error instanceof Error ? error.message : String(error)
				if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorMessage.includes('constraint')) {
					console.log(`⏭️ Database sync skipped - duplicate detected: "${localGoal.title}"`)
				} else {
					console.error(`⚠️ Background sync failed for goal "${localGoal.title}":`, error)
				}
				// Don't throw error - local creation succeeded
			}
		}

		return localGoal
	}

	async updateGoal(id: number | string, goalData: Partial<SavedGoal>): Promise<SavedGoal | null> {
		// Always update localStorage first
		let localGoal: SavedGoal | null = null

		if (typeof id === "number") {
			localGoal = updateLocalGoal(id, goalData)
		} else {
			// If it's a UUID, find the local goal and update it
			const localGoals = getLocalGoals()
			const index = localGoals.findIndex(g => g.id?.toString() === id)
			if (index !== -1) {
				localGoals[index] = { ...localGoals[index], ...goalData }
				setLocalGoals(localGoals)
				localGoal = localGoals[index]
			}
		}

		// If user is paid, also sync to database in background
		if (localGoal && this.shouldSync) {
			try {
				await updateGoal(id as string, goalData, this.userId!)
				console.log(`🔄 Background sync: Updated goal "${localGoal.title}" in database`)
			} catch (error) {
				console.error(`⚠️ Background sync failed for goal "${localGoal.title}":`, error)
				// Don't throw error - local update succeeded
			}
		}

		return localGoal
	}

	async deleteGoal(id: number | string): Promise<boolean> {
		// Find the goal to get its signature before deletion
		let goalToDelete: SavedGoal | null = null

		if (typeof id === "number") {
			goalToDelete = getLocalGoalById(id)
		} else {
			const localGoals = getLocalGoals()
			goalToDelete = localGoals.find(g => g.id?.toString() === id) || null
		}

		// Always delete from localStorage first
		let success = false

		if (typeof id === "number") {
			deleteLocalGoal(id)
			success = true
		} else {
			// If it's a UUID, find and delete from local storage
			const localGoals = getLocalGoals()
			const filteredGoals = localGoals.filter(g => g.id?.toString() !== id)
			if (filteredGoals.length < localGoals.length) {
				setLocalGoals(filteredGoals)
				success = true
			}
		}

		// Clean up goal signature
		if (success && goalToDelete) {
			const signature = generateGoalSignature(goalToDelete)
			removeGoalSignature(signature)
			console.log(`🗑️ Cleaned up signature for deleted goal: "${goalToDelete.title}"`)
		}

		// If user is paid, also delete from database in background
		if (success && this.shouldSync) {
			try {
				await deleteGoal(id as string, this.userId!)
				console.log(`🔄 Background sync: Deleted goal from database`)
			} catch (error) {
				console.error(`⚠️ Background sync failed for goal deletion:`, error)
				// Don't throw error - local deletion succeeded
			}
		}

		return success
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

		// Update the milestone status back to pending/in-progress
		const updatedMilestones = [...goal.milestones]
		updatedMilestones[milestoneIndex] = {
			...updatedMilestones[milestoneIndex],
			status: milestoneIndex === 0 ? "in-progress" : "pending",
			progress: milestoneIndex === 0 ? 10 : 0,
		}

		// Set any subsequent milestones back to pending
		for (let i = milestoneIndex + 1; i < updatedMilestones.length; i++) {
			if (updatedMilestones[i].status === "in-progress") {
				updatedMilestones[i] = {
					...updatedMilestones[i],
					status: "pending",
					progress: 0,
				}
				break
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

	async adjustTimeline(goalId: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal || !goal.milestones) return

		// Simple timeline adjustment - add one week to all pending milestones
		const updatedMilestones = goal.milestones.map((milestone) => {
			if (milestone.status === "pending") {
				return {
					...milestone,
					week: milestone.week + 1,
				}
			}
			return milestone
		})

		await this.updateGoal(goalId, {
			milestones: updatedMilestones,
		})
	}

	// Cleanup method
	destroy(): void {
		this.stopAutoSync()
	}

	// Get sync status information
	getSyncInfo(): {
		lastSync: string | null;
		isPaidUser: boolean;
		shouldSync: boolean;
		autoSyncActive: boolean;
	} {
		return {
			lastSync: getLastSyncTimestamp(),
			isPaidUser: this.isPaidUser,
			shouldSync: this.shouldSync,
			autoSyncActive: !!this.syncIntervalId
		}
	}
}

// Create a singleton instance
let dataManagerInstance: GoalDataManager | null = null

export function getDataManager(userId?: string, userProfile?: DatabaseUserProfile | null): GoalDataManager {
	if (!dataManagerInstance) {
		dataManagerInstance = new GoalDataManager(userId, userProfile)
	} else {
		dataManagerInstance.setUserData(userId || null, userProfile)
	}

	return dataManagerInstance
}

// Cleanup function for when the app unmounts
export function cleanupDataManager(): void {
	if (dataManagerInstance) {
		dataManagerInstance.destroy()
		dataManagerInstance = null
	}
}
