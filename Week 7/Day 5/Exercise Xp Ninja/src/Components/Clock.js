import { useEffect, useState } from 'react'

function Clock() {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setCurrentDate(new Date())
    const timerId = window.setInterval(tick, 1000)

    return () => window.clearInterval(timerId)
  }, [])

  return (
    <time className="clock" dateTime={currentDate.toISOString()}>
      {currentDate.toLocaleTimeString()}
    </time>
  )
}

export default Clock
