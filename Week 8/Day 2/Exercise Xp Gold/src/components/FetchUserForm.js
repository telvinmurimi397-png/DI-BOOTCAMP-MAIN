import React from 'react'

class FetchUserForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: '',
      email: '',
      status: '',
      isSubmitting: false,
    }
  }

  handleChange = (event) => {
    const { name, value } = event.target
    this.setState({ [name]: value })
  }

  handleSubmit = async (event) => {
    event.preventDefault()
    const { user, email } = this.state
    this.setState({ isSubmitting: true, status: '' })

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ name: user, email }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const postedUser = await response.json()
      console.log('Posted user:', postedUser)
      this.setState({ status: `User posted successfully (response ID: ${postedUser.id}).` })
    } catch (error) {
      console.error('Unable to post user:', error)
      this.setState({ status: 'The request failed. Check the browser console and try again.' })
    } finally {
      this.setState({ isSubmitting: false })
    }
  }

  render() {
    const { user, email, status, isSubmitting } = this.state

    return (
      <section className="exercise-panel">
        <div className="panel-heading">
          <p className="eyebrow">Exercise 1 · Fetch</p>
          <h2>Post a user</h2>
          <p>Send a name and email to the JSONPlaceholder users endpoint.</p>
        </div>
        <form onSubmit={this.handleSubmit} className="exercise-form">
          <div className="mb-3">
            <label className="form-label" htmlFor="fetch-user">User</label>
            <input
              className="form-control"
              id="fetch-user"
              name="user"
              type="text"
              placeholder="Your name"
              value={user}
              onChange={this.handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="fetch-email">Email</label>
            <input
              className="form-control"
              id="fetch-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={this.handleChange}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Submit user'}
          </button>
          {status && <p className="request-status" role="status">{status}</p>}
        </form>
      </section>
    )
  }
}

export default FetchUserForm