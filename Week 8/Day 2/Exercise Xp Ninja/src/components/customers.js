import React from 'react'

class Customers extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      customers: [],
      isLoaded: false,
      errorMsg: '',
    }
  }

  componentDidMount() {
    fetch('/api/customers/')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Customers request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((customers) => this.setState({ customers, isLoaded: true }))
      .catch((error) => {
        console.error('Unable to load customers from Express:', error)
        this.setState({ isLoaded: true, errorMsg: 'Could not load customers from the Express API.' })
      })
  }

  render() {
    const { customers, isLoaded, errorMsg } = this.state

    if (!isLoaded) {
      return <p className="loading-message" role="status">Loading customers...</p>
    }

    if (errorMsg) {
      return <p className="error-message" role="alert">{errorMsg}</p>
    }

    return (
      <ul className="result-list">
        {customers.map((customer) => (
          <li className="customer-row" key={customer.id}>
            <span className="record-id">{String(customer.id).padStart(2, '0')}</span>
            <span>{customer.firstName} {customer.lastName}</span>
          </li>
        ))}
      </ul>
    )
  }
}

export default Customers