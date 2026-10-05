import React from 'react'
import './index.css'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      helloMessage: '',
      inputValue: '',
      responseMessage: '',
      errorMsg: '',
      isSending: false,
    }
  }

  componentDidMount() {
    this.loadHelloMessage()
  }

  loadHelloMessage = async () => {
    try {
      const response = await fetch('/api/hello')
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = await response.json()
      this.setState({ helloMessage: data.message })
    } catch (error) {
      console.error('Unable to fetch the Express greeting:', error)
      this.setState({ errorMsg: 'Could not connect to the Express server.' })
    }
  }

  handleChange = (event) => {
    this.setState({ inputValue: event.target.value })
  }

  handleSubmit = async (event) => {
    event.preventDefault()
    const message = this.state.inputValue.trim()
    if (!message) return

    this.setState({ isSending: true, responseMessage: '', errorMsg: '' })

    try {
      const response = await fetch('/api/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = await response.json()
      this.setState({ responseMessage: data.message })
    } catch (error) {
      console.error('Unable to send the message to Express:', error)
      this.setState({ errorMsg: 'The message could not be sent. Check that the Express server is running.' })
    } finally {
      this.setState({ isSending: false })
    }
  }

  render() {
    const { helloMessage, inputValue, responseMessage, errorMsg, isSending } = this.state

    return (
      <main className="page-shell">
        <header className="page-header">
          <p className="eyebrow">Daily Challenge · React + Express</p>
          <h1>{helloMessage || 'Connecting to Express...'}</h1>
          <p>Send a message from this React client and read the server response below.</p>
        </header>

        <section className="message-panel" aria-labelledby="message-heading">
          <div className="panel-heading">
            <p className="eyebrow">POST /api/world</p>
            <h2 id="message-heading">Send a message</h2>
          </div>
          <form onSubmit={this.handleSubmit}>
            <label htmlFor="message" className="form-label">Your message</label>
            <div className="input-row">
              <input
                id="message"
                className="message-input"
                type="text"
                value={inputValue}
                onChange={this.handleChange}
                placeholder="Type something to send..."
                autoComplete="off"
                required
              />
              <button className="send-button" type="submit" disabled={isSending || !inputValue.trim()}>
                {isSending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>

          {responseMessage && <p className="server-response" role="status">{responseMessage}</p>}
          {errorMsg && <p className="error-message" role="alert">{errorMsg}</p>}
        </section>

        <footer className="page-footer">
          <span>Client <code>localhost:5173</code></span>
          <span>Express API <code>localhost:3001</code></span>
        </footer>
      </main>
    )
  }
}

export default App