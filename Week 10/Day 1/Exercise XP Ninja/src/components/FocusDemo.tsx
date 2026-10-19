import { useEffect, useRef, useState } from 'react'

function FocusDemo() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    setFocused(document.activeElement === inputRef.current)
  }, [])

  function focusInput() {
    inputRef.current?.focus()
    setFocused(true)
  }

  return (
    <div className="panel-body focus-body">
      <p className="component-description">This field grabs focus on mount. Press the button to focus it again.</p>
      <div className="focus-controls">
        <input
          ref={inputRef}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="The DOM element is typed"
          aria-label="Focus demonstration input"
        />
        <button className="button button-dark" type="button" onClick={focusInput}>Focus input <span aria-hidden="true">↗</span></button>
      </div>
      <p className="focus-state" aria-live="polite"><span className={`focus-indicator ${focused ? 'is-focused' : ''}`} />{focused ? 'Input is focused' : 'Input is not focused'}</p>
    </div>
  )
}

export default FocusDemo
