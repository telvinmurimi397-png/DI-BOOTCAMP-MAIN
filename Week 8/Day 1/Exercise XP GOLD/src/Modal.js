import React from 'react'

class Modal extends React.Component {
  render() {
    const { errorInfo, onClose } = this.props

    return (
      <div
        className="modal-background"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <section
          className="modal-body"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="error-title"
          aria-describedby="error-message"
        >
          <div className="modal-icon" aria-hidden="true">
            !
          </div>
          <p className="modal-eyebrow">Application error</p>
          <h2 id="error-title">Something went wrong</h2>
          <p id="error-message" className="modal-message">
            {errorInfo?.error?.message ?? 'An unexpected error occurred.'}
          </p>
          {errorInfo?.componentStack && (
            <details className="error-details">
              <summary>Technical details</summary>
              <pre>{errorInfo.componentStack}</pre>
            </details>
          )}
          <button className="close-button" onClick={onClose} autoFocus>
            Close
          </button>
        </section>
      </div>
    )
  }
}

export default Modal
