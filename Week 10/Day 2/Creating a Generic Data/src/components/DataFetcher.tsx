import { useEffect, type ReactNode } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchData } from '../api/api'
import { fetchFailure, fetchStart, fetchSuccess } from '../features/dataSlice'
import type { AppDispatch, RootState } from '../store'

type DataFetcherProps<T> = {
  url: string
  title: string
  renderItem: (item: T, index: number) => ReactNode
}

export function DataFetcher<T>({ url, title, renderItem }: DataFetcherProps<T>) {
  const dispatch = useDispatch<AppDispatch>()
  const data = useSelector((state: RootState) => state.data.data as T[])
  const loading = useSelector((state: RootState) => state.data.loading)
  const error = useSelector((state: RootState) => state.data.error)

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      dispatch(fetchStart())

      try {
        const result = await fetchData<T>(url)

        if (!isMounted) return

        dispatch(fetchSuccess(result as unknown[]))
      } catch (err) {
        if (!isMounted) return

        dispatch(
          fetchFailure(
            err instanceof Error ? err.message : 'An unexpected error occurred while fetching the data.',
          ),
        )
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [dispatch, url])

  if (loading) {
    return <div className="status-card">Loading {title.toLowerCase()}...</div>
  }

  if (error) {
    return <div className="status-card error">Error: {error}</div>
  }

  return (
    <section className="data-section">
      <h2>{title}</h2>
      <div className="card-list">
        {data.length === 0 ? (
          <p className="empty-state">No {title.toLowerCase()} available.</p>
        ) : (
          data.map((item, index) => <div key={index}>{renderItem(item, index)}</div>)
        )}
      </div>
    </section>
  )
}
