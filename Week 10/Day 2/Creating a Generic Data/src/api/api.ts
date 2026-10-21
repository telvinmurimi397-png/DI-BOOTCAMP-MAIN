export async function fetchData<T>(url: string): Promise<T[]> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const payload = await response.json()

  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object' && 'results' in payload && Array.isArray(payload.results)) {
    return payload.results as T[]
  }

  return [payload as T]
}
