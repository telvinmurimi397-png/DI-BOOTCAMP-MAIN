import express from 'express'

const app = express()
const port = process.env.PORT || 3001

app.get('/users', (request, response) => {
  response.json([
    { id: 1, username: 'somebody' },
    { id: 2, username: 'somebody_else' },
  ])
})

app.listen(port, () => {
  console.log(`Users API listening at http://localhost:${port}/users`)
})