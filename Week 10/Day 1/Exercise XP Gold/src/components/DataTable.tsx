import { useMemo, useState, type ReactNode } from 'react'

export interface TableColumn<T extends { id: number | string }> {
  key: keyof T
  title: string
  sortable?: boolean
  render?: (value: T[keyof T], row: T) => ReactNode
}

type SortDirection = 'ascending' | 'descending'

interface SortConfig<T extends { id: number | string }> {
  key: keyof T
  direction: SortDirection
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[]
  columns: TableColumn<T>[]
  onSort?: (key: keyof T, direction: SortDirection) => void
  onSelect?: (selectedRows: T[]) => void
  filter?: (row: T, query: string) => boolean
  filterPlaceholder?: string
}

function compareValues(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onSort,
  onSelect,
  filter,
  filterPlaceholder = 'Filter rows…',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<T['id']>>(() => new Set())
  const [query, setQuery] = useState('')

  const visibleRows = useMemo(() => {
    const filtered = filter && query.trim()
      ? data.filter((row) => filter(row, query.trim()))
      : data

    if (!sortConfig) return filtered
    return [...filtered].sort((left, right) => {
      const result = compareValues(left[sortConfig.key], right[sortConfig.key])
      return sortConfig.direction === 'ascending' ? result : -result
    })
  }, [data, filter, query, sortConfig])

  const selectedVisibleCount = visibleRows.filter((row) => selectedIds.has(row.id)).length
  const allVisibleSelected = visibleRows.length > 0 && selectedVisibleCount === visibleRows.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected

  function notifySelection(nextIds: Set<T['id']>) {
    setSelectedIds(nextIds)
    onSelect?.(data.filter((row) => nextIds.has(row.id)))
  }

  function toggleSort(key: keyof T) {
    const direction: SortDirection =
      sortConfig?.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
    setSortConfig({ key, direction })
    onSort?.(key, direction)
  }

  function toggleRow(row: T) {
    const nextIds = new Set(selectedIds)
    if (nextIds.has(row.id)) nextIds.delete(row.id)
    else nextIds.add(row.id)
    notifySelection(nextIds)
  }

  function toggleAllVisible() {
    const nextIds = new Set(selectedIds)
    if (allVisibleSelected) visibleRows.forEach((row) => nextIds.delete(row.id))
    else visibleRows.forEach((row) => nextIds.add(row.id))
    notifySelection(nextIds)
  }

  return (
    <div className="table-content">
      <div className="table-toolbar">
        {filter
          ? <label className="table-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={filterPlaceholder} aria-label={filterPlaceholder} /></label>
          : <span className="table-selection-note">Select rows to compare teammates</span>}
        <span className="selection-count" aria-live="polite">{selectedIds.size} SELECTED</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  aria-label="Select all visible rows"
                  checked={allVisibleSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someVisibleSelected
                  }}
                  onChange={toggleAllVisible}
                />
              </th>
              {columns.map((column) => (
                <th key={String(column.key)} aria-sort={
                  sortConfig?.key === column.key
                    ? sortConfig.direction === 'ascending' ? 'ascending' : 'descending'
                    : 'none'
                }>
                  {column.sortable
                    ? <button className="sort-button" type="button" onClick={() => toggleSort(column.key)}>
                        {column.title}
                        <span aria-hidden="true">{sortConfig?.key === column.key ? sortConfig.direction === 'ascending' ? ' ↑' : ' ↓' : ' ↕'}</span>
                      </button>
                    : column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className={selectedIds.has(row.id) ? 'selected-row' : undefined}>
                <td className="checkbox-column">
                  <input type="checkbox" aria-label={`Select row ${row.id}`} checked={selectedIds.has(row.id)} onChange={() => toggleRow(row)} />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr><td className="empty-table" colSpan={columns.length + 1}>No teammates match “{query}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="table-footnote">Showing {visibleRows.length} of {data.length} teammates</p>
    </div>
  )
}

export default DataTable
