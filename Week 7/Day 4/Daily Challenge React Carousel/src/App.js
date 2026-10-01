import { Carousel } from 'react-responsive-carousel'

const destinations = [
  {
    name: 'Hong Kong',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/jrfyzvgzvhs1iylduuhj.jpg',
    detail: 'Harbour lights and hillside views',
  },
  {
    name: 'Macao',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/c1cklkyp6ms02tougufx.webp',
    detail: 'Portuguese lanes, bold flavours',
  },
  {
    name: 'Japan',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/e8fnw35p6zgusq218foj.webp',
    detail: 'A thousand ways to find wonder',
  },
  {
    name: 'Las Vegas',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/liw377az16sxmp9a6ylg.webp',
    detail: 'Desert nights, turned all the way up',
  },
]

function App() {
  return (
    <main className="destination-page">
      <header className="page-heading container">
        <a className="wordmark" href="#top" id="top">
          <span className="wordmark-icon" aria-hidden="true">E</span>
          <span>Elsewhere</span>
        </a>
        <div className="heading-copy">
          <p className="eyebrow">A small atlas of big feelings</p>
          <h1>Somewhere new.</h1>
          <p className="intro">Four places to start imagining your next escape.</p>
        </div>
      </header>

      <section className="carousel-section container" aria-label="Featured destinations">
        <Carousel
          ariaLabel="Featured destinations"
          showArrows
          showStatus
          showIndicators
          showThumbs
          infiniteLoop
          swipeable
          emulateTouch
          useKeyboardArrows
          preventMovementUntilSwipeScrollTolerance
          swipeScrollTolerance={8}
          renderIndicator={(onClickHandler, isSelected, index, label) => (
            <button
              className={`destination-indicator${isSelected ? ' is-selected' : ''}`}
              type="button"
              onClick={onClickHandler}
              onKeyDown={onClickHandler}
              value={index}
              aria-label={`${label} ${index + 1}`}
              aria-current={isSelected ? 'true' : undefined}
            />
          )}
        >
          {destinations.map((destination) => (
            <div className="destination-slide" key={destination.name}>
              <img src={destination.image} alt={destination.name} />
              <div className="legend">
                <span>{destination.name}</span>
                <span className="legend-detail">{destination.detail}</span>
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      <footer className="page-footer container">
        <span>Four stops. Endless ways to get there.</span>
        <span className="footer-index">01 — 04</span>
      </footer>
    </main>
  )
}

export default App
