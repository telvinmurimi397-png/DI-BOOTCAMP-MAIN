import { useState } from 'react'
import quotes from './quotes.js'

const palettes = [
  { background: '#f8e8dc', quote: '#673d37', button: '#b75143' },
  { background: '#e3f0e8', quote: '#245649', button: '#347b62' },
  { background: '#e8e9f8', quote: '#3e4278', button: '#6269b5' },
  { background: '#f4edce', quote: '#66521f', button: '#a27c22' },
  { background: '#f4e3ee', quote: '#713d60', button: '#a54e81' },
  { background: '#e0eff1', quote: '#24515a', button: '#317984' },
]

function randomIndexExcept(length, currentIndex) {
  return (currentIndex + 1 + Math.floor(Math.random() * (length - 1))) % length
}

function App() {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * quotes.length),
  )
  const [paletteIndex, setPaletteIndex] = useState(() =>
    Math.floor(Math.random() * palettes.length),
  )

  const quote = quotes[quoteIndex]
  const palette = palettes[paletteIndex]

  function generateQuote() {
    setQuoteIndex((currentIndex) =>
      randomIndexExcept(quotes.length, currentIndex),
    )
    setPaletteIndex((currentIndex) =>
      randomIndexExcept(palettes.length, currentIndex),
    )
  }

  return (
    <main
      className="page"
      style={{ '--page-background': palette.background }}
    >
      <div className="page-content">
        <p className="eyebrow">A little inspiration, just for you</p>
        <section className="quote-card" aria-label="Random quote">
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <blockquote
            className="quote"
            style={{ color: palette.quote }}
            aria-live="polite"
            aria-atomic="true"
          >
            {quote.quote}
          </blockquote>
          <p className="author">— {quote.author}</p>
          <button
            className="generate-button"
            style={{ backgroundColor: palette.button }}
            type="button"
            onClick={generateQuote}
          >
            Inspire me
            <span aria-hidden="true"> ↗</span>
          </button>
        </section>
        <p className="hint">A fresh thought is one click away.</p>
      </div>
    </main>
  )
}

export default App
