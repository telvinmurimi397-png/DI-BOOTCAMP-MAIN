import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by route boundary:', error, errorInfo)
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="boundary-fallback" role="alert">
          <p className="eyebrow">Screen unavailable</p>
          <h2>This page hit an error.</h2>
          <p>The rest of the app is still running. Use the navigation to continue.</p>
        </section>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary