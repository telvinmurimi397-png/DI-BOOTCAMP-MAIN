import React from 'react'
import Modal from './Modal.js'

class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
    errorInfo: null,
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorInfo: { error },
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo: { error, componentStack: errorInfo.componentStack } })
  }

  occurError = () => {
    this.setState({
      hasError: true,
      errorInfo: {
        error: new Error('A simulated error was triggered.'),
        componentStack: 'Triggered by clicking the Show Error button.',
      },
    })
  }

  closeError = () => {
    this.setState({ hasError: false, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return <Modal errorInfo={this.state.errorInfo} onClose={this.closeError} />
    }

    return this.props.children(this.occurError)
  }
}

export default ErrorBoundary
