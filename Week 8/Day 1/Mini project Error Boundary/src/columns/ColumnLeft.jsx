import { useState } from 'react'
import axios from 'axios'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'

export function ColumnLeft() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchImages = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data } = await axios.get('https://picsum.photos/v2/list?page=0&limit=2')
      setImages(data)
    } catch (requestError) {
      setError(`Unable to load images: ${requestError.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="column-left py-4 px-3">
      <h2>Left column</h2>
      <Button className="my-4" variant="primary" onClick={fetchImages} disabled={loading}>
        {loading ? 'Loading images…' : 'Get images'}
      </Button>
      {error && <p className="text-danger" role="alert">{error}</p>}
      {images.map(({ id, author, download_url }) => (
        <div key={id} className="images">
          <img src={download_url} alt={`Photograph by ${author}`} />
          <p className="image-credit">Photo by {author}</p>
        </div>
      ))}
    </Container>
  )
}
