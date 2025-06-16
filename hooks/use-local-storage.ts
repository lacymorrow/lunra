"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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
	const defaultValueRef = useRef(defaultValue)

	// Update ref when defaultValue changes
	useEffect(() => {
		defaultValueRef.current = defaultValue
	}, [defaultValue])

	// Read from localStorage - stabilized function
	const readValue = useCallback(() => {
		if (typeof window === "undefined") {
			return defaultValueRef.current
		}

		try {
			setLoading(true)
			setError(null)

			const item = localStorage.getItem(key)
			if (item === null) {
				return defaultValueRef.current
			}

			return JSON.parse(item) as T
		} catch (err) {
			const error = err instanceof Error ? err : new Error(`Failed to read localStorage key "${key}"`)
			setError(error)
			console.error("localStorage read error:", error)
			return defaultValueRef.current
		} finally {
			setLoading(false)
		}
	}, [key]) // Only depend on key, not defaultValue

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

	// Initialize value on mount - only run once
	useEffect(() => {
		if (typeof window === "undefined") {
			return
		}

		try {
			setLoading(true)
			setError(null)

			const item = localStorage.getItem(key)
			const initialValue = item === null ? defaultValueRef.current : JSON.parse(item) as T
			setValue(initialValue)
		} catch (err) {
			const error = err instanceof Error ? err : new Error(`Failed to read localStorage key "${key}"`)
			setError(error)
			console.error("localStorage read error:", error)
			setValue(defaultValueRef.current)
		} finally {
			setLoading(false)
		}
	}, [key]) // Only depend on key

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
