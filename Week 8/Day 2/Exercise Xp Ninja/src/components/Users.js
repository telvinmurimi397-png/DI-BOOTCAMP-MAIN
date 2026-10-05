import React from 'react'

class Users extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
      isLoaded: false,
      errorMsg: '',
    }
  }

  componentDidMount() {
    fetch('/users')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Users request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((users) => this.setState({ users, isLoaded: true }))
      .catch((error) => {
        console.error('Unable to load users from Express:', error)
        this.setState({ isLoaded: true, errorMsg: 'Could not load users from the Express API.' })
      })
  }

  render() {
    const { users, isLoaded, errorMsg } = this.state

    if (!isLoaded) {
      return <p className="loading-message" role="status">Loading users...</p>
    }

    if (errorMsg) {
      return <p className="error-message" role="alert">{errorMsg}</p>
    }

    return (
      <ul className="result-list">
        {users.map((user) => (
          <li className="user-row" key={user.id}>
            <span className="record-id">{String(user.id).padStart(2, '0')}</span>
            <span>{user.username}</span>
          </li>
        ))}
      </ul>
    )
  }
}

export default Users