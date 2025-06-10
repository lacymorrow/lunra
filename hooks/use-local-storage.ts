"use client"

import { useCallback, useEffect, useState } from "react"

interface LocalStorageHook<T> {
    value: T | null
    setValue: (value: T | null) => void
    loading: boolean
    error: Error | null
    clear: () => void
    refresh: () => void
}

export function useLocalStorage<T = any>(key: string, defaultValue: T | null = null): LocalStorageHook<T> {
    const [value, setValue] = useState<T | null>(defaultValue)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Read from localStorage
    const readValue = useCallback(() => {
        if (typeof window === "undefined") {
            return defaultValue
        }

        try {
            setLoading(true)
            setError(null)

            const item = localStorage.getItem(key)
            if (item === null) {
                return defaultValue
            }

            return JSON.parse(item) as T
        } catch (err) {
            const error = err instanceof Error ? err : new Error(`Failed to read localStorage key "${key}"`)
            setError(error)
            console.error("localStorage read error:", error)
            return defaultValue
        } finally {
            setLoading(false)
        }
    }, [key, defaultValue])

    // Write to localStorage
    const writeValue = useCallback((newValue: T | null) => {
        if (typeof window === "undefined") {
            return
        }

        try {
            setError(null)

            if (newValue === null) {
                localStorage.removeItem(key)
            } else {
                localStorage.setItem(key, JSON.stringify(newValue))
            }

            setValue(newValue)
        } catch (err) {
            const error = err instanceof Error ? err : new Error(`Failed to write localStorage key "${key}"`)
            setError(error)
            console.error("localStorage write error:", error)
        }
    }, [key])

    // Clear localStorage
    const clearValue = useCallback(() => {
        writeValue(null)
    }, [writeValue])

    // Refresh from localStorage
    const refreshValue = useCallback(() => {
        const newValue = readValue()
        setValue(newValue)
    }, [readValue])

    // Initialize value on mount
    useEffect(() => {
        const initialValue = readValue()
        setValue(initialValue)
    }, [readValue])

    // Listen for localStorage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue !== JSON.stringify(value)) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : null
                    setValue(newValue)
                } catch (err) {
                    console.error("Failed to parse localStorage change:", err)
                }
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [key, value])

    return {
        value,
        setValue: writeValue,
        loading,
        error,
        clear: clearValue,
        refresh: refreshValue,
    }
}

// Specialized hook for goals
export function useLocalGoals() {
    const goalsStorage = useLocalStorage("savedGoals", [])

    const addGoal = useCallback((goal: any) => {
        const currentGoals = goalsStorage.value || []
        const newId = currentGoals.length > 0 ? Math.max(...currentGoals.map((g: any) => g.id)) + 1 : 1
        const newGoal = {
            ...goal,
            id: newId,
            createdAt: new Date().toISOString(),
        }
        goalsStorage.setValue([...currentGoals, newGoal])
        return newGoal
    }, [goalsStorage])

    const updateGoal = useCallback((id: number, updates: any) => {
        const currentGoals = goalsStorage.value || []
        const updatedGoals = currentGoals.map((goal: any) =>
            goal.id === id ? { ...goal, ...updates } : goal
        )
        goalsStorage.setValue(updatedGoals)
        return updatedGoals.find((g: any) => g.id === id) || null
    }, [goalsStorage])

    const deleteGoal = useCallback((id: number) => {
        const currentGoals = goalsStorage.value || []
        const filteredGoals = currentGoals.filter((goal: any) => goal.id !== id)
        goalsStorage.setValue(filteredGoals)
    }, [goalsStorage])

    const getGoalById = useCallback((id: number) => {
        const currentGoals = goalsStorage.value || []
        return currentGoals.find((goal: any) => goal.id === id) || null
    }, [goalsStorage])

    return {
        goals: goalsStorage.value || [],
        loading: goalsStorage.loading,
        error: goalsStorage.error,
        addGoal,
        updateGoal,
        deleteGoal,
        getGoalById,
        clearAll: goalsStorage.clear,
        refresh: goalsStorage.refresh,
    }
}

// Hook to check if user has local data that needs syncing
export function useLocalDataStatus() {
    const { goals, loading } = useLocalGoals()

    const hasLocalData = !loading && goals.length > 0
    const localDataCount = goals.length

    return {
        hasLocalData,
        localDataCount,
        loading,
    }
}
