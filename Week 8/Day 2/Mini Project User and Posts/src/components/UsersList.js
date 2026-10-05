import React from 'react'

class UsersList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: [],
      isLoaded: false,
      errorMsg: '',
    }
  }

  componentDidMount() {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Users request failed with status ${response.status}`)
        }
        return response.json()
      })
      .then((users) => this.setState({ users, isLoaded: true }))
      .catch((error) => {
        console.error('Unable to load users:', error)
        this.setState({ isLoaded: true, errorMsg: 'Users could not be loaded. Please try again later.' })
      })
  }

  render() {
    const { users, isLoaded, errorMsg } = this.state

    return (
      <section className="feed-section" aria-labelledby="users-heading">
        <header className="feed-heading">
          <div>
            <p className="eyebrow">Collection 02</p>
            <h2 id="users-heading">Directory</h2>
          </div>
          {isLoaded && !errorMsg && <span className="feed-count">{users.length} people</span>}
        </header>
        {!isLoaded ? (
          <p className="feed-message" role="status">Loading users...</p>
        ) : errorMsg ? (
          <p className="feed-message feed-error" role="alert">{errorMsg}</p>
        ) : (
          <ul className="user-list">
            {users.map((user) => (
              <li className="user-item" key={user.id}>
                <span className="user-initial" aria-hidden="true">{user.name.charAt(0)}</span>
                <div>
                  <h3>{user.name}</h3>
                  <a href={`mailto:${user.email}`}>{user.email}</a>
                  <p>{user.company.name} <span>·</span> {user.address.city}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }
}

export default UsersList