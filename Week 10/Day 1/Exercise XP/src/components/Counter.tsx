import { useState } from 'react'

type CounterAction = 'increment' | 'decrement' | null

function Counter() {
  const [count, setCount] = useState<number>(0)
  const [lastAction, setLastAction] = useState<CounterAction>(null)

  function updateCount(action: Exclude<CounterAction, null>) {
    setCount((currentCount) => currentCount + (action === 'increment' ? 1 : -1))
    setLastAction(action)
  }

  return (
    <div className="counter-content">
      <div className="counter-readout" aria-live="polite">{count}</div>
      <div className="counter-controls">
        <button className="counter-button secondary-button" type="button" onClick={() => updateCount('decrement')} aria-label="Decrement counter">−</button>
        <button className="counter-button primary-button" type="button" onClick={() => updateCount('increment')} aria-label="Increment counter">+</button>
      </div>
      <p className="action-feedback" aria-live="polite">
        {lastAction ? `Last action: ${lastAction}` : 'Choose an action to begin'}
      </p>
    </div>
  )
}

export default Counter
