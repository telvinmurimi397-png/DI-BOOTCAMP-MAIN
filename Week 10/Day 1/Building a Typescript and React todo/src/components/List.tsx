import type { ReactNode } from 'react'

interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  getKey?: (item: T, index: number) => string | number
  emptyMessage?: string
}

function List<T>({
  items,
  renderItem,
  getKey,
  emptyMessage = 'Nothing here yet.',
}: ListProps<T>) {
  if (items.length === 0) {
    return <p className="empty-list">{emptyMessage}</p>
  }

  return (
    <ul className="book-list">
      {items.map((item, index) => (
        <li key={getKey ? getKey(item, index) : index}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  )
}

export default List
