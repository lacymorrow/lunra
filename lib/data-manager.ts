import { createGoal, deleteGoal, getGoals, updateGoal } from "@/lib/services/goals"
import type { SavedGoal } from "@/types"
import type { DatabaseUserProfile } from "@/types/database"
import { convertDatabaseToLocalStorage } from "@/types/database"

// Local storage keys
const GOALS_KEY = "savedGoals"
const LAST_SYNC_KEY = "lastSyncTimestamp"

// --- Helpers: goal signature for dedup (title+description, case-insensitive) ---

function goalSignature(title: string, description: string | null | undefined): string {
	return `${(title || "").toLowerCase().trim()}|${(description || "").toLowerCase().trim()}`
}

// --- Helper functions for localStorage ---

function getLocalGoals(): SavedGoal[] {
	if (typeof window === "undefined") return []

	const savedGoals = localStorage.getItem(GOALS_KEY)
	if (!savedGoals) return []

	try {
		return JSON.parse(savedGoals)
	} catch (error) {
		console.error("Failed to parse localStorage goals, resetting:", error)
		return []
	}
}

function setLocalGoals(goals: SavedGoal[]): void {
	if (typeof window === "undefined") return
	localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

function getLocalGoalById(id: number): SavedGoal | null {
	const goals = getLocalGoals()
	return goals.find((goal) => goal.id === id) || null
}

/** Find a local goal by its database UUID (dbId field). */
function getLocalGoalByDbId(dbId: string): SavedGoal | null {
	const goals = getLocalGoals()
	return goals.find((goal) => goal.dbId === dbId) || null
}

function generateNextId(goals: SavedGoal[]): number {
	if (goals.length === 0) return 1
	// Use reduce instead of Math.max(...spread) to avoid stack overflow on large arrays
	return goals.reduce((max, g) => Math.max(max, g.id), 0) + 1
}

function createLocalGoal(goal: Omit<SavedGoal, "id" | "createdAt">): SavedGoal {
	const goals = getLocalGoals()
	const newId = generateNextId(goals)

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

function deleteLocalGoal(id: number): boolean {
	const goals = getLocalGoals()
	const filteredGoals = goals.filter((goal) => goal.id !== id)
	const deleted = filteredGoals.length < goals.length
	if (deleted) {
		setLocalGoals(filteredGoals)
	}
	return deleted
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
	/** Promise-based queue: DB writes chain sequentially instead of being dropped. */
	private _dbWriteQueue: Promise<void> = Promise.resolve()
	/** True while a bidirectional sync or initial sync is running. */
	private _syncing = false

	constructor(userId?: string, userProfile?: DatabaseUserProfile | null) {
		this.userId = userId || null
		this.userProfile = userProfile || null

		// Start auto-sync for paid users
		if (this.isPaidUser) {
			this.startAutoSync()
		}
	}

	setUserData(userId: string | null, userProfile?: DatabaseUserProfile | null) {
		const prevUserId = this.userId
		const prevPlanId = this.userProfile?.plan_id
		this.userId = userId
		this.userProfile = userProfile ?? null

		// Only restart auto-sync if user or plan actually changed
		const userChanged = prevUserId !== userId
		const planChanged = prevPlanId !== this.userProfile?.plan_id
		if (userChanged || planChanged) {
			if (this.isPaidUser) {
				this.startAutoSync()
			} else {
				this.stopAutoSync()
			}
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

	/** Expose syncing state for tests / UI. */
	get isSyncing(): boolean {
		return this._syncing
	}

	private startAutoSync(): void {
		// Clear any existing interval
		this.stopAutoSync()

		// Sync every 30 seconds for paid users
		this.syncIntervalId = setInterval(async () => {
			// Skip if a full sync is already running
			if (this._syncing) {
				return
			}
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

	// ----------------------------------------------------------------
	// Bidirectional sync — fixed to use dbId + signature matching
	// ----------------------------------------------------------------

	async bidirectionalSync(): Promise<{
		localToDbSynced: number;
		dbToLocalSynced: number;
		conflicts: number;
		errors: string[];
	}> {
		if (!this.shouldSync) {
			return { localToDbSynced: 0, dbToLocalSynced: 0, conflicts: 0, errors: [] }
		}

		// Acquire mutex
		if (this._syncing) {
			return { localToDbSynced: 0, dbToLocalSynced: 0, conflicts: 0, errors: ["Sync already in progress"] }
		}
		this._syncing = true

		try {
			const result = {
				localToDbSynced: 0,
				dbToLocalSynced: 0,
				conflicts: 0,
				errors: [] as string[]
			}

			// Get both sides
			let localGoals = getLocalGoals()
			const dbGoals = await getGoals(this.userId!)
			const dbGoalsConverted = dbGoals.map(convertDatabaseToLocalStorage) as SavedGoal[]

			// Build lookup maps:
			// 1. dbId → local goal  (for goals already synced)
			// 2. signature → local goal  (fallback for goals not yet linked)
			const localByDbId = new Map<string, SavedGoal>()
			const localBySig = new Map<string, SavedGoal>()
			for (const g of localGoals) {
				if (g.dbId) localByDbId.set(g.dbId, g)
				// Only store the first match per signature to avoid overwrites
				const sig = goalSignature(g.title, g.description)
				if (!localBySig.has(sig)) {
					localBySig.set(sig, g)
				}
			}

			// dbId set for quick "is this DB goal known locally?"
			const knownDbIds = new Set(localGoals.map(g => g.dbId).filter(Boolean))

			// --- Sync DOWN: DB → local ---
			for (const dbGoal of dbGoalsConverted) {
				const dbUuid = dbGoal.dbId!
				// Already linked?
				if (knownDbIds.has(dbUuid)) {
					// Check for conflict (DB changed vs local)
					const local = localByDbId.get(dbUuid)!
					if (this.hasConflict(local, dbGoal)) {
						// Local wins — push local state to DB
						try {
							await updateGoal(dbUuid, local, this.userId!)
							result.conflicts++
						} catch (error) {
							result.errors.push(`Conflict resolution failed for "${local.title}": ${error instanceof Error ? error.message : String(error)}`)
						}
					}
					continue
				}

				// Not linked by dbId — try signature match (covers initial-sync migration)
				const sig = goalSignature(dbGoal.title, dbGoal.description)
				const matchBySig = localBySig.get(sig)
				if (matchBySig && !matchBySig.dbId) {
					// Link the existing local goal to this DB record
					updateLocalGoal(matchBySig.id, { dbId: dbUuid })
					knownDbIds.add(dbUuid)
					localByDbId.set(dbUuid, matchBySig)
					continue
				}

				// Truly new from DB — pull down
				try {
					localGoals = getLocalGoals() // re-read in case prior iteration mutated
					const newId = generateNextId(localGoals)
					const newLocal: SavedGoal = { ...dbGoal, id: newId, dbId: dbUuid }
					localGoals.push(newLocal)
					setLocalGoals(localGoals)
					result.dbToLocalSynced++
				} catch (error) {
					result.errors.push(`Failed to sync DB goal "${dbGoal.title}" locally: ${error instanceof Error ? error.message : String(error)}`)
				}
			}

			// --- Sync UP: local → DB ---
			// Re-read local goals (may have been mutated above)
			localGoals = getLocalGoals()
			const dbUuids = new Set(dbGoals.map(g => g.id))

			for (const localGoal of localGoals) {
				// Already in DB?
				if (localGoal.dbId && dbUuids.has(localGoal.dbId)) continue

				// Not in DB yet — push up
				try {
					const created = await createGoal(localGoal, this.userId!)
					if (created) {
						// Store the DB UUID back on the local goal
						updateLocalGoal(localGoal.id, { dbId: created.id })
					}
					result.localToDbSynced++
				} catch (error) {
					result.errors.push(`Failed to sync local goal "${localGoal.title}" to DB: ${error instanceof Error ? error.message : String(error)}`)
				}
			}

			// Update last sync timestamp
			setLastSyncTimestamp(new Date().toISOString())

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
		} finally {
			this._syncing = false
		}
	}

	private hasConflict(localGoal: SavedGoal, dbGoal: SavedGoal): boolean {
		// Simple conflict detection - compare key fields using nullish-safe comparison
		return (
			localGoal.title !== dbGoal.title ||
			(localGoal.description ?? "") !== (dbGoal.description ?? "") ||
			localGoal.progress !== dbGoal.progress ||
			localGoal.status !== dbGoal.status ||
			JSON.stringify(localGoal.milestones) !== JSON.stringify(dbGoal.milestones)
		)
	}

	// ----------------------------------------------------------------
	// Initial sync — runs once when user first authenticates.
	// Now also stores the DB UUID (dbId) on each local goal.
	// ----------------------------------------------------------------

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

		// Acquire mutex
		if (this._syncing) {
			return { synced: 0, skipped: 0, errors: ["Sync already in progress"], clearedLocal: false }
		}
		this._syncing = true

		try {
			// Get existing database goals to avoid duplicates
			const dbGoals = await getGoals(this.userId!)

			// Build signature → DB UUID map for linking
			const dbGoalsBySignature = new Map<string, string>()
			for (const g of dbGoals) {
				dbGoalsBySignature.set(goalSignature(g.title, g.description), g.id)
			}

			let synced = 0
			let skipped = 0
			const errors: string[] = []

			// Process each local goal
			for (const localGoal of localGoals) {
				// Already linked to a DB record?
				if (localGoal.dbId) {
					skipped++
					continue
				}

				const sig = goalSignature(localGoal.title, localGoal.description)

				// Signature match with existing DB goal — link without creating duplicate
				const existingDbId = dbGoalsBySignature.get(sig)
				if (existingDbId) {
					updateLocalGoal(localGoal.id, { dbId: existingDbId })
					skipped++
					continue
				}

				// New goal — push to DB and store UUID
				try {
					const created = await createGoal(localGoal, this.userId!)
					if (created) {
						updateLocalGoal(localGoal.id, { dbId: created.id })
					}
					synced++
				} catch (error) {
					const errorMsg = `Failed to sync "${localGoal.title}": ${error instanceof Error ? error.message : String(error)}`
					console.error(errorMsg)
					errors.push(errorMsg)
				}
			}

			return {
				synced,
				skipped,
				errors,
				clearedLocal: false
			}
		} catch (error) {
			const errorMsg = `Database sync failed: ${error instanceof Error ? error.message : String(error)}`
			console.error(errorMsg)
			return {
				synced: 0,
				skipped: 0,
				errors: [errorMsg],
				clearedLocal: false
			}
		} finally {
			this._syncing = false
		}
	}

	// ----------------------------------------------------------------
	// Queue helper — DB writes chain sequentially instead of being dropped.
	// ----------------------------------------------------------------

	private _enqueueDbWrite(dbOperation: () => Promise<void>): void {
		if (!this.shouldSync) return

		this._dbWriteQueue = this._dbWriteQueue.then(async () => {
			try {
				await dbOperation()
			} catch (error) {
				console.error("Background DB operation failed:", error)
			}
		})
	}

	// ----------------------------------------------------------------
	// Core CRUD — all operations use localStorage as primary storage.
	// DB writes use dbId (UUID) instead of casting numeric IDs.
	// ----------------------------------------------------------------

	async getGoals(): Promise<SavedGoal[]> {
		return getLocalGoals()
	}

	async getGoalById(id: number | string): Promise<SavedGoal | null> {
		if (typeof id === "number") {
			return getLocalGoalById(id)
		}

		// If it's a UUID string, look up by dbId
		return getLocalGoalByDbId(id)
	}

	async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal> {
		// Always create in localStorage first for immediate offline access
		const localGoal = createLocalGoal(goalData)

		// If user is paid, also sync to database in background via queue
		this._enqueueDbWrite(async () => {
			const created = await createGoal(localGoal, this.userId!)
			if (created) {
				// Store the DB UUID on the local goal
				updateLocalGoal(localGoal.id, { dbId: created.id })
				localGoal.dbId = created.id
			}
		})

		return localGoal
	}

	async updateGoal(id: number | string, goalData: Partial<SavedGoal>): Promise<SavedGoal | null> {
		let localGoal: SavedGoal | null = null

		if (typeof id === "number") {
			localGoal = updateLocalGoal(id, goalData)
		} else {
			// UUID string — find by dbId
			const goals = getLocalGoals()
			const index = goals.findIndex(g => g.dbId === id)
			if (index !== -1) {
				goals[index] = { ...goals[index], ...goalData }
				setLocalGoals(goals)
				localGoal = goals[index]
			}
		}

		// Sync the full merged goal to DB using the real UUID
		if (localGoal?.dbId) {
			const goalDbId = localGoal.dbId
			// Send the full merged local goal to the DB, not just the partial
			const fullGoal = { ...localGoal }
			this._enqueueDbWrite(async () => {
				await updateGoal(goalDbId, fullGoal, this.userId!)
			})
		}

		return localGoal
	}

	async deleteGoal(id: number | string): Promise<boolean> {
		let success = false
		let dbId: string | undefined

		if (typeof id === "number") {
			// Look up dbId before deleting
			const goal = getLocalGoalById(id)
			if (!goal) return false
			dbId = goal.dbId
			success = deleteLocalGoal(id)
		} else {
			// UUID string — find by dbId
			const goals = getLocalGoals()
			const target = goals.find(g => g.dbId === id)
			if (target) {
				dbId = target.dbId
				const filtered = goals.filter(g => g.dbId !== id)
				setLocalGoals(filtered)
				success = true
			}
		}

		// Delete from DB using the real UUID
		if (success && dbId) {
			const goalDbId = dbId
			this._enqueueDbWrite(async () => {
				await deleteGoal(goalDbId, this.userId!)
			})
		}

		return success
	}

	// ----------------------------------------------------------------
	// Milestone operations (unchanged logic, just use this.updateGoal)
	// ----------------------------------------------------------------

	async markMilestoneComplete(goalId: number, milestoneIndex: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal || !goal.milestones || !goal.milestones[milestoneIndex]) return

		const updatedMilestones = [...goal.milestones]
		updatedMilestones[milestoneIndex] = {
			...updatedMilestones[milestoneIndex],
			status: "completed",
			progress: 100,
		}

		const nextPendingIndex = updatedMilestones.findIndex((m, index) => index > milestoneIndex && m.status === "pending")
		if (nextPendingIndex !== -1) {
			updatedMilestones[nextPendingIndex] = {
				...updatedMilestones[nextPendingIndex],
				status: "in-progress",
				progress: 10,
			}
		}

		const totalMilestones = updatedMilestones.length
		const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
		const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

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
		updatedMilestones[milestoneIndex] = {
			...updatedMilestones[milestoneIndex],
			status: milestoneIndex === 0 ? "in-progress" : "pending",
			progress: milestoneIndex === 0 ? 10 : 0,
		}

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

		const totalMilestones = updatedMilestones.length
		const completedMilestones = updatedMilestones.filter((m) => m.status === "completed").length
		const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

		await this.updateGoal(goalId, {
			milestones: updatedMilestones,
			progress: newProgress,
			status: newProgress === 100 ? "completed" : newProgress >= 50 ? "on-track" : "in-progress",
		})
	}

	async adjustTimeline(goalId: number): Promise<void> {
		const goal = await this.getGoalById(goalId)
		if (!goal || !goal.milestones) return

		const updatedMilestones = goal.milestones.map((milestone) => {
			if (milestone.status === "pending") {
				return { ...milestone, week: milestone.week + 1 }
			}
			return milestone
		})

		await this.updateGoal(goalId, { milestones: updatedMilestones })
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
