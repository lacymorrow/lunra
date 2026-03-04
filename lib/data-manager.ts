import { createGoal, deleteGoal, getGoals, updateGoal } from "@/lib/services/goals"
import type { SavedGoal } from "@/types"
import type { DatabaseUserProfile } from "@/types/database"
import { convertDatabaseToLocalStorage } from "@/types/database"

// Local storage keys
const GOALS_KEY = "savedGoals"
const LAST_SYNC_KEY = "lastSyncTimestamp"

// Goal signature for dedup (title+description, case-insensitive)
function goalSignature(title: string, description: string | null | undefined): string {
	return `${(title || "").toLowerCase().trim()}|${(description || "").toLowerCase().trim()}`
}

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
	// Uses signature-based matching (title+description) to avoid duplicates,
	// since local numeric IDs and DB UUIDs are fundamentally different.
	async bidirectionalSync(): Promise<{
		localToDbSynced: number;
		dbToLocalSynced: number;
		conflicts: number;
		errors: string[];
	}> {
		if (!this.shouldSync) {
			return { localToDbSynced: 0, dbToLocalSynced: 0, conflicts: 0, errors: [] }
		}

		console.log("🔄 Starting bidirectional sync for paid user")

		try {
			const result = {
				localToDbSynced: 0,
				dbToLocalSynced: 0,
				conflicts: 0,
				errors: [] as string[]
			}

			// Get both local and database goals
			let localGoals = getLocalGoals()
			const dbGoals = await getGoals(this.userId!)
			const dbGoalsConverted = dbGoals.map(convertDatabaseToLocalStorage)

			// Build signature-based lookup maps for matching
			const dbSignatures = new Map<string, typeof dbGoalsConverted[0]>()
			const dbUuids = new Set<string>()
			for (const g of dbGoalsConverted) {
				dbSignatures.set(goalSignature(g.title, g.description), g)
				if (g.dbId) dbUuids.add(g.dbId)
			}

			const localByDbId = new Map<string, SavedGoal>()
			const localBySig = new Map<string, SavedGoal>()
			for (const g of localGoals) {
				if (g.dbId) localByDbId.set(g.dbId, g)
				localBySig.set(goalSignature(g.title, g.description), g)
			}

			// --- Sync UP: local → DB ---
			for (const localGoal of localGoals) {
				const sig = goalSignature(localGoal.title, localGoal.description)

				// Already in DB by dbId link?
				if (localGoal.dbId && dbUuids.has(localGoal.dbId)) continue

				// Already in DB by signature?
				const dbMatch = dbSignatures.get(sig)
				if (dbMatch) {
					// Link the local goal to the DB record if not linked yet
					if (!localGoal.dbId && dbMatch.dbId) {
						updateLocalGoal(localGoal.id, { dbId: dbMatch.dbId })
						console.log(`🔗 Linked local goal "${localGoal.title}" to DB UUID ${dbMatch.dbId}`)
					}
					continue
				}

				// Truly new — push to DB
				try {
					const created = await createGoal(localGoal, this.userId!)
					if (created) {
						updateLocalGoal(localGoal.id, { dbId: created.id })
						console.log(`📤 Synced local goal to database: "${localGoal.title}" → ${created.id}`)
					}
					result.localToDbSynced++
				} catch (error) {
					const errorMsg = `Failed to sync local goal "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					result.errors.push(errorMsg)
					console.error(errorMsg)
				}
			}

			// --- Sync DOWN: DB → local ---
			// Re-read local goals (may have been mutated above)
			localGoals = getLocalGoals()
			// Rebuild local lookup
			localBySig.clear()
			localByDbId.clear()
			for (const g of localGoals) {
				if (g.dbId) localByDbId.set(g.dbId, g)
				localBySig.set(goalSignature(g.title, g.description), g)
			}

			for (const dbGoal of dbGoalsConverted) {
				const dbUuid = dbGoal.dbId!

				// Already linked locally by dbId?
				if (localByDbId.has(dbUuid)) {
					// Check for conflicts — local wins
					const local = localByDbId.get(dbUuid)!
					if (this.hasConflict(local, dbGoal)) {
						try {
							await updateGoal(dbUuid, local, this.userId!)
							result.conflicts++
							console.log(`🔀 Resolved conflict for "${local.title}" (local wins)`)
						} catch (error) {
							result.errors.push(`Conflict resolution failed for "${local.title}": ${error instanceof Error ? error.message : String(error)}`)
						}
					}
					continue
				}

				// Match by signature?
				const sig = goalSignature(dbGoal.title, dbGoal.description)
				const matchBySig = localBySig.get(sig)
				if (matchBySig) {
					// Link it if unlinked, or skip if it's a DB duplicate
					if (!matchBySig.dbId) {
						updateLocalGoal(matchBySig.id, { dbId: dbUuid })
						console.log(`🔗 Linked local goal "${matchBySig.title}" to DB UUID ${dbUuid}`)
					} else {
						console.log(`⏭️ Skipping DB duplicate of "${dbGoal.title}"`)
					}
					continue
				}

				// Truly new from DB — pull down
				try {
					localGoals = getLocalGoals()
					const newId = localGoals.length > 0 ? Math.max(...localGoals.map(g => g.id)) + 1 : 1
					const newLocal: SavedGoal = { ...dbGoal, id: newId, dbId: dbUuid }
					localGoals.push(newLocal)
					setLocalGoals(localGoals)
					// Update lookup maps for subsequent iterations
					localByDbId.set(dbUuid, newLocal)
					localBySig.set(sig, newLocal)
					result.dbToLocalSynced++
					console.log(`📥 Synced DB goal to local: "${dbGoal.title}"`)
				} catch (error) {
					result.errors.push(`Failed to sync DB goal "${dbGoal.title}" locally: ${error instanceof Error ? error.message : String(error)}`)
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

			let synced = 0
			let skipped = 0
			const errors: string[] = []

			// Build signature → DB UUID map for linking
			const dbGoalsBySignature = new Map<string, string>()
			for (const g of dbGoals) {
				dbGoalsBySignature.set(goalSignature(g.title, g.description), g.id)
			}

			// Process each local goal
			for (const [index, localGoal] of localGoals.entries()) {
				// Already linked to a DB record?
				if (localGoal.dbId) {
					console.log(`⏭️  Already linked: "${localGoal.title}" → ${localGoal.dbId}`)
					skipped++
					continue
				}

				const sig = goalSignature(localGoal.title, localGoal.description)

				// Signature match — link without creating duplicate
				const existingDbId = dbGoalsBySignature.get(sig)
				if (existingDbId) {
					updateLocalGoal(localGoal.id, { dbId: existingDbId })
					console.log(`🔗 Linked existing goal "${localGoal.title}" → ${existingDbId}`)
					skipped++
					continue
				}

				// New goal — push to DB and store UUID
				try {
					console.log(`📤 Syncing goal ${index + 1}/${localGoals.length}: "${localGoal.title}"`)
					const created = await createGoal(localGoal, this.userId!)
					if (created) {
						updateLocalGoal(localGoal.id, { dbId: created.id })
						console.log(`✅ Synced: "${localGoal.title}" → ${created.id}`)
					}
					synced++
				} catch (error) {
					const errorMsg = `Failed to sync "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					console.error(`❌ ${errorMsg}`)
					errors.push(errorMsg)
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
		// Return from localStorage with deduplication by signature
		const raw = getLocalGoals()
		const seen = new Map<string, number>() // signature → index in result
		const result: SavedGoal[] = []

		for (const goal of raw) {
			const sig = goalSignature(goal.title, goal.description)
			const existingIdx = seen.get(sig)

			if (existingIdx !== undefined) {
				// Duplicate detected — prefer the one with dbId, or the earlier one
				const existing = result[existingIdx]
				if (!existing.dbId && goal.dbId) {
					result[existingIdx] = goal
				}
				continue
			}

			seen.set(sig, result.length)
			result.push(goal)
		}

		// Persist cleaned list if duplicates were removed
		if (result.length < raw.length) {
			console.log(`🧹 Deduped goals: ${raw.length} → ${result.length}`)
			setLocalGoals(result)
		}

		return result
	}

	async getGoalById(id: number | string): Promise<SavedGoal | null> {
		if (typeof id === "number") {
			return getLocalGoalById(id)
		}

		// If it's a UUID string, find by dbId
		const localGoals = getLocalGoals()
		return localGoals.find(g => g.dbId === id) || null
	}

	async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal> {
		// Always create in localStorage first for immediate offline access
		const localGoal = createLocalGoal(goalData)

		// If user is paid, also sync to database in background
		if (this.shouldSync) {
			try {
				const created = await createGoal(localGoal, this.userId!)
				if (created) {
					// Store the DB UUID on the local goal for sync matching
					updateLocalGoal(localGoal.id, { dbId: created.id })
					localGoal.dbId = created.id
					console.log(`🔄 Background sync: Created goal "${localGoal.title}" → ${created.id}`)
				}
			} catch (error) {
				console.error(`⚠️ Background sync failed for goal "${localGoal.title}":`, error)
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

		// If user is paid, also sync to database in background using the real UUID
		if (localGoal?.dbId && this.shouldSync) {
			try {
				await updateGoal(localGoal.dbId, goalData, this.userId!)
				console.log(`🔄 Background sync: Updated goal "${localGoal.title}" in database`)
			} catch (error) {
				console.error(`⚠️ Background sync failed for goal "${localGoal.title}":`, error)
				// Don't throw error - local update succeeded
			}
		}

		return localGoal
	}

	async deleteGoal(id: number | string): Promise<boolean> {
		// Capture dbId before deleting from localStorage
		let success = false
		let dbId: string | undefined

		if (typeof id === "number") {
			const goal = getLocalGoalById(id)
			dbId = goal?.dbId
			deleteLocalGoal(id)
			success = true
		} else {
			// If it's a UUID, find and delete from local storage
			const localGoals = getLocalGoals()
			const target = localGoals.find(g => g.dbId === id || g.id?.toString() === id)
			dbId = target?.dbId
			const filteredGoals = localGoals.filter(g => g !== target)
			if (filteredGoals.length < localGoals.length) {
				setLocalGoals(filteredGoals)
				success = true
			}
		}

		// If user is paid, also delete from database in background using the real UUID
		if (success && dbId && this.shouldSync) {
			try {
				await deleteGoal(dbId, this.userId!)
				console.log(`🔄 Background sync: Deleted goal ${dbId} from database`)
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
