export function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date, amount) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

export function getWeekDates(dateKey) {
  const selectedDate = fromDateKey(dateKey)
  const mondayOffset = (selectedDate.getDay() + 6) % 7
  const monday = addDays(selectedDate, -mondayOffset)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}

export function formatDayLabel(dateKey, options) {
  return new Intl.DateTimeFormat(undefined, options).format(fromDateKey(dateKey))
}
