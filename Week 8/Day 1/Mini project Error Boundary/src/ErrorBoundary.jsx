import React from 'react'

class ErrorBoundary extends React.Component {
  state = {
    error: null,
    errorInfo: null,
    hasError: false,
  }

  static getDerivedStateFromError(error) {
    return { error, hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="card my-5 border-danger">
        <div className="card-body">
          <h3 className="card-title text-danger">Something went wrong.</h3>
          <p className="card-text">
            This section could not be displayed. Reload the page to try again.
          </p>
          <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <details className="error-details mt-3">
            <summary>Error details</summary>
            <pre className="mt-2 mb-0">
              {this.state.error?.toString()}
              {'\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
