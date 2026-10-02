import { useState } from 'react'

function Events() {
  const [isToggleOn, setIsToggleOn] = useState(true)

  const clickMe = () => {
    alert('I was clicked')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      alert(event.currentTarget.value)
    }
  }

  const toggleButton = () => {
    setIsToggleOn((isOn) => !isOn)
  }

  return (
    <div className="exercise-content">
      <button type="button" onClick={clickMe}>
        Click me
      </button>
      <label className="exercise-form">
        Type a message and press Enter:
        <input type="text" onKeyDown={handleKeyDown} />
      </label>
      <button type="button" onClick={toggleButton}>
        {isToggleOn ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

export default Events
