import express from 'express'

const app = express()
const port = process.env.PORT || 3002
const customers = [
  { id: 1, firstName: 'John', lastName: 'Doe' },
  { id: 2, firstName: 'Jane', lastName: 'Doe' },
  { id: 3, firstName: 'Ziv', lastName: 'Chen' },
  { id: 4, firstName: 'Isaac', lastName: 'Groisman' },
  { id: 5, firstName: 'Avner', lastName: 'Maman' },
  { id: 6, firstName: 'Megan', lastName: 'Dreyfuss' },
]

app.get('/api/customers/', (request, response) => {
  response.json(customers)
})

app.listen(port, () => {
  console.log(`Customers API listening at http://localhost:${port}/api/customers/`)
})