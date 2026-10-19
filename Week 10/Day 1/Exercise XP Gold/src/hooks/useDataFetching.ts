import { useCallback, useEffect, useRef, useState } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface UseDataFetchingConfig {
  maxAge: number
}

interface UseDataFetchingResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  fetchedAt: number | null
  refetch: () => Promise<void>
  invalidateCache: () => void
}

const cache = new Map<string, CacheEntry<unknown>>()
const inFlightRequests = new Map<string, Promise<unknown>>()
const latestRequest = new Map<string, symbol>()

async function requestData<T>(url: string, maxAge: number, force: boolean): Promise<CacheEntry<T>> {
  const cached = cache.get(url) as CacheEntry<T> | undefined
  if (!force && cached && Date.now() - cached.timestamp < maxAge) return cached

  const currentRequest = inFlightRequests.get(url)
  if (!force && currentRequest) {
    const data = await currentRequest as T
    return cache.get(url) as CacheEntry<T> ?? { data, timestamp: Date.now() }
  }

  const requestId = Symbol(url)
  latestRequest.set(url, requestId)
  const request = (async () => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Request failed (HTTP ${response.status}).`)
    const data = await response.json() as T
    const entry = { data, timestamp: Date.now() }
    if (latestRequest.get(url) === requestId) cache.set(url, entry)
    return entry
  })()
  inFlightRequests.set(url, request as Promise<unknown>)

  try {
    return await request
  } finally {
    if (inFlightRequests.get(url) === request) inFlightRequests.delete(url)
  }
}

function useDataFetching<T>(url: string, { maxAge }: UseDataFetchingConfig): UseDataFetchingResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const requestVersion = useRef(0)

  const load = useCallback(async (force: boolean) => {
    const version = ++requestVersion.current
    setIsLoading(true)
    setError(null)
    try {
      const entry = await requestData<T>(url, maxAge, force)
      if (requestVersion.current === version) {
        setData(entry.data)
        setFetchedAt(entry.timestamp)
      }
    } catch (requestError: unknown) {
      if (requestVersion.current === version) {
        setError(requestError instanceof Error ? requestError.message : 'An unexpected error occurred while fetching data.')
      }
    } finally {
      if (requestVersion.current === version) setIsLoading(false)
    }
  }, [maxAge, url])

  useEffect(() => {
    void load(false)
    return () => {
      requestVersion.current += 1
    }
  }, [load])

  const refetch = useCallback(() => load(true), [load])
  const invalidateCache = useCallback(() => {
    cache.delete(url)
  }, [url])

  return { data, isLoading, error, fetchedAt, refetch, invalidateCache }
}

export default useDataFetching
