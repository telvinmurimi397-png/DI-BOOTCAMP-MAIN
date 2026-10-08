const API_URL = 'https://commons.wikimedia.org/w/api.php'

export async function fetchImages(query, continuation, signal) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '800',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })

  if (continuation) {
    params.set('gsroffset', continuation)
  }

  const response = await fetch(`${API_URL}?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Image search failed (${response.status}). Please try again.`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.info || 'Image search failed. Please try again.')
  }

  const images = (data.query?.pages ?? [])
    .map((page) => {
      const image = page.imageinfo?.[0]
      if (!image?.thumburl) return null

      return {
        id: page.pageid,
        title: page.title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
        imageUrl: image.thumburl,
        pageUrl: image.descriptionurl,
      }
    })
    .filter(Boolean)

  return {
    images,
    continuation: data.continue?.gsroffset ?? null,
  }
}
