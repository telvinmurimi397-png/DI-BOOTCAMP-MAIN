import React from 'react'
import axios from 'axios'

class AxiosPostForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      userId: '',
      title: '',
      body: '',
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
    const { userId, title, body } = this.state
    this.setState({ isSubmitting: true, status: '' })

    try {
      const response = await axios.post('https://jsonplaceholder.typicode.com/posts', {
        userId: Number(userId),
        title,
        body,
      })
      console.log('Posted post:', response.data)
      this.setState({ status: `Post created successfully (response ID: ${response.data.id}).` })
    } catch (error) {
      console.error('Unable to post data with Axios:', error)
      this.setState({ status: 'The request failed. Check the browser console and try again.' })
    } finally {
      this.setState({ isSubmitting: false })
    }
  }

  render() {
    const { userId, title, body, status, isSubmitting } = this.state

    return (
      <section className="exercise-panel">
        <div className="panel-heading">
          <p className="eyebrow">Exercise 2 · Axios</p>
          <h2>Post an article</h2>
          <p>Send a user ID, title, and body to the JSONPlaceholder posts endpoint.</p>
        </div>
        <form onSubmit={this.handleSubmit} className="exercise-form">
          <div className="mb-3">
            <label className="form-label" htmlFor="axios-user-id">User ID</label>
            <input
              className="form-control"
              id="axios-user-id"
              name="userId"
              type="number"
              min="1"
              placeholder="1"
              value={userId}
              onChange={this.handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="axios-title">Title</label>
            <input
              className="form-control"
              id="axios-title"
              name="title"
              type="text"
              placeholder="Article title"
              value={title}
              onChange={this.handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="axios-body">Body</label>
            <textarea
              className="form-control"
              id="axios-body"
              name="body"
              rows="4"
              placeholder="Write a short article..."
              value={body}
              onChange={this.handleChange}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Submit post'}
          </button>
          {status && <p className="request-status" role="status">{status}</p>}
        </form>
      </section>
    )
  }
}

export default AxiosPostForm