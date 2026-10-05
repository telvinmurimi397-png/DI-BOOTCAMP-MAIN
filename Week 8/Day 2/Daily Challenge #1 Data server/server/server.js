import express from 'express'

const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

app.get('/api/hello', (request, response) => {
  response.json({ message: 'Hello From Express' })
})

app.post('/api/world', (request, response) => {
  console.log('Client POST body:', request.body)
  const { message = '' } = request.body || {}

  response.json({
    message: `I received your POST request. This is what you sent me: ${message}`,
  })
})

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`)
})