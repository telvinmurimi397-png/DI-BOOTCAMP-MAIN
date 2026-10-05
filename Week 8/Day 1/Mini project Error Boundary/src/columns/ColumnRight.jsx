import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import ErrorBoundary from '../ErrorBoundary.jsx'

export function ColumnRight() {
  const crasher = { function: 'I live to crash' }
  const [text, setText] = useState(JSON.stringify(crasher))

  const eventHandler = () => {
    throw new Error('Event handler error')
  }

  return (
    <Container className="column-right py-4 px-4">
      <h2>Right column</h2>

      <p>
        There are two types of errors we can trigger inside this component: a rendering error and a
        regular JavaScript error.
      </p>

      <hr />
      <ErrorBoundary>
        <p>
          Clicking this button will replace the <code>stringified</code> object,{' '}
          <code>{text}</code>, with the original object. This will result in a rendering error.
        </p>
      </ErrorBoundary>

      <Button
        className="me-3 mb-3"
        variant="danger"
        onClick={() => setText(crasher)}
      >
        Replace string with object
      </Button>

      <hr />

      <p>
        Clicking this button will invoke an event handler, inside of which an error is thrown.
      </p>

      <Button className="me-3" variant="danger" onClick={eventHandler}>
        Invoke event handler
      </Button>
    </Container>
  )
}
