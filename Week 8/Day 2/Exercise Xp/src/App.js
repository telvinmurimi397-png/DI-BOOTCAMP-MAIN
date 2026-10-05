import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import ErrorBoundary from './ErrorBoundary.js'
import PostList from './components/PostList.js'
import Example1 from './components/Example1.js'
import Example2 from './components/Example2.js'
import Example3 from './components/Example3.js'

const webhookPayload = {
  key1: 'myusername',
  email: 'mymail@gmail.com',
  name: 'Isaac',
  lastname: 'Doe',
  age: 27,
}

function HomeScreen() {
  const [webhookUrl, setWebhookUrl] = useState(import.meta.env.VITE_WEBHOOK_URL || '')
  const [requestMessage, setRequestMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function sendJson(event) {
    event.preventDefault()
    setRequestMessage('')
    setIsSending(true)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
      const responseBody = await response.text()
      console.log('Webhook response:', response.status, responseBody)
      setRequestMessage(`Response received (${response.status}). Check the browser console for the response body.`)
    } catch (error) {
      console.error('Webhook request failed:', error)
      setRequestMessage('The request failed. Check the endpoint, CORS setting, and browser console.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="container lesson-page">
      <header className="page-intro">
        <p className="eyebrow">Week 8 · Day 2</p>
        <h1>React Router &amp; JSON</h1>
        <p>Small exercises in navigation, state, component recovery, and data-driven UI.</p>
      </header>

      <section className="lesson-section" aria-labelledby="home-title">
        <p className="eyebrow">Exercise 1 · React Router</p>
        <h2 id="home-title">Home screen</h2>
        <p>This route is wrapped in its own error boundary. Visit Shop to see the fallback in action.</p>
      </section>

      <section className="lesson-section" aria-labelledby="posts-title">
        <p className="eyebrow">Exercise 2 · JSON</p>
        <h2 id="posts-title">Posts</h2>
        <PostList />
      </section>

      <section className="lesson-section" aria-labelledby="data-title">
        <p className="eyebrow">Exercise 3 · Nested JSON</p>
        <h2 id="data-title">Profile data</h2>
        <div className="row g-3">
          <div className="col-12 col-lg-4"><Example1 /></div>
          <div className="col-12 col-lg-4"><Example2 /></div>
          <div className="col-12"><Example3 /></div>
        </div>
      </section>

      <section className="lesson-section" aria-labelledby="webhook-title">
        <p className="eyebrow">Exercise 4 · POST JSON</p>
        <h2 id="webhook-title">Send a webhook</h2>
        <p>Paste your webhook.site unique URL. Enable CORS on that endpoint before sending.</p>
        <form onSubmit={sendJson} className="webhook-form">
          <label className="form-label" htmlFor="webhook-url">Webhook URL</label>
          <div className="input-group">
            <input
              className="form-control"
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://webhook.site/your-unique-id"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={isSending}>
              {isSending ? 'Sending…' : 'Send JSON'}
            </button>
          </div>
        </form>
        {requestMessage && <p className="request-message" role="status">{requestMessage}</p>}
      </section>
    </main>
  )
}

function ProfileScreen() {
  return (
    <main className="container lesson-page route-page">
      <p className="eyebrow">Exercise 1 · React Router</p>
      <h1>Profile screen</h1>
      <p>This route has an independent error boundary.</p>
    </main>
  )
}

function ShopScreen() {
  throw new Error('Shop screen error: this is the Error Boundary exercise.')
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand navbar-dark site-nav">
        <div className="container">
          <NavLink className="navbar-brand" to="/">React Lab</NavLink>
          <div className="navbar-nav ms-auto">
            <NavLink end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">Home</NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/profile">Profile</NavLink>
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/shop">Shop</NavLink>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<ErrorBoundary><HomeScreen /></ErrorBoundary>} />
        <Route path="/profile" element={<ErrorBoundary><ProfileScreen /></ErrorBoundary>} />
        <Route path="/shop" element={<ErrorBoundary><ShopScreen /></ErrorBoundary>} />
        <Route path="*" element={<main className="container lesson-page route-page"><h1>Page not found</h1></main>} />
      </Routes>
      <footer className="container site-footer">Week 8 · React Router, error boundaries, and JSON</footer>
    </BrowserRouter>
  )
}

export default App