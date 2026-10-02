import { useState } from 'react'

const emptyUser = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
}

function UserForm() {
  const [user, setUser] = useState(emptyUser)
  const [submittedUser, setSubmittedUser] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.currentTarget
    setUser((currentUser) => ({ ...currentUser, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmittedUser({ ...user })
  }

  const handleReset = () => {
    setUser(emptyUser)
    setSubmittedUser(null)
  }

  return submittedUser ? (
    <div className="submitted-user">
      <h3>Welcome, {submittedUser.firstName}!</h3>
      <p>
        Name: {submittedUser.firstName} {submittedUser.lastName}
      </p>
      <p>Phone: {submittedUser.phone}</p>
      <p>Email: {submittedUser.email}</p>
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </div>
  ) : (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        First name
        <input
          type="text"
          name="firstName"
          value={user.firstName}
          onChange={handleChange}
          autoComplete="given-name"
          required
        />
      </label>
      <label>
        Last name
        <input
          type="text"
          name="lastName"
          value={user.lastName}
          onChange={handleChange}
          autoComplete="family-name"
          required
        />
      </label>
      <label>
        Phone
        <input
          type="tel"
          name="phone"
          value={user.phone}
          onChange={handleChange}
          autoComplete="tel"
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          name="email"
          value={user.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  )
}

export default UserForm
