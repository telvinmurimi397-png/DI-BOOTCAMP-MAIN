import { useRef, useState } from 'react'

function CharacterCounter() {
  const inputRef = useRef(null)
  const [characterCount, setCharacterCount] = useState(0)

  function updateCharacterCount() {
    setCharacterCount(inputRef.current.value.length)
  }

  return (
    <div className="counter-control">
      <label htmlFor="character-input">Your text</label>
      <textarea
        id="character-input"
        ref={inputRef}
        onInput={updateCharacterCount}
        placeholder="Start typing here…"
        rows="4"
      />
      <p className="counter-total" aria-live="polite">
        Characters: <strong>{characterCount}</strong>
      </p>
    </div>
  )
}

export default CharacterCounter
