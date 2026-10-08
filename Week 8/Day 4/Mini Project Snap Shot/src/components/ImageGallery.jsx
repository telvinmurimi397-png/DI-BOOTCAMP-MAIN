import { useEffect, useState } from 'react'
import { fetchImages } from '../api.js'

function ImageCard({ image }) {
  return (
    <a
      className="image-card"
      href={image.pageUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`View ${image.title} on Wikimedia Commons`}
    >
      <img src={image.imageUrl} alt={image.title} loading="lazy" />
      <span className="image-caption">{image.title}</span>
      <span className="image-open" aria-hidden="true">
        ↗
      </span>
    </a>
  )
}

function ImageGallery({ query, heading }) {
  const [images, setImages] = useState([])
  const [continuation, setContinuation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [moreError, setMoreError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadImages() {
      setImages([])
      setContinuation(null)
      setError('')
      setMoreError('')
      setIsLoading(true)

      try {
        const result = await fetchImages(query, null, controller.signal)
        setImages(result.images)
        setContinuation(result.continuation)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message)
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadImages()
    return () => controller.abort()
  }, [query])

  async function loadMore() {
    if (!continuation || isLoadingMore) return

    setIsLoadingMore(true)
    setMoreError('')

    try {
      const result = await fetchImages(query, continuation)
      setImages((currentImages) => {
        const existingIds = new Set(currentImages.map((image) => image.id))
        return [
          ...currentImages,
          ...result.images.filter((image) => !existingIds.has(image.id)),
        ]
      })
      setContinuation(result.continuation)
    } catch (loadError) {
      setMoreError(loadError.message)
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <section className="gallery-section" aria-labelledby="gallery-heading">
      <div className="gallery-heading">
        <div>
          <p className="section-kicker">The collection</p>
          <h1 id="gallery-heading">{heading}</h1>
        </div>
        {!isLoading && !error && (
          <span className="result-count">
            {images.length} {images.length === 1 ? 'photo' : 'photos'}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="status-message" role="status">
          <span className="spinner" aria-hidden="true" />
          Finding photographs for you…
        </div>
      )}

      {error && (
        <div className="status-message error-message" role="alert">
          {error}
        </div>
      )}

      {!isLoading && !error && images.length === 0 && (
        <div className="status-message">No photos found. Try another search.</div>
      )}

      {!isLoading && !error && images.length > 0 && (
        <>
          <div className="image-grid">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} />
            ))}
          </div>

          {moreError && (
            <p className="more-error" role="alert">
              {moreError}
            </p>
          )}

          {continuation && (
            <div className="load-more-wrap">
              <button
                className="load-more-button"
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading photos…' : 'Load more photos'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default ImageGallery
