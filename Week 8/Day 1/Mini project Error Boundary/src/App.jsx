import Navbar from 'react-bootstrap/Navbar'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import ErrorBoundary from './ErrorBoundary.jsx'
import { ColumnLeft } from './columns/ColumnLeft.jsx'
import { ColumnRight } from './columns/ColumnRight.jsx'

function App() {
  return (
    <>
      <Navbar bg="dark" variant="dark" className="px-3">
        <Navbar.Brand href="#">Error boundaries in React</Navbar.Brand>
      </Navbar>

      <Container fluid>
        <Row>
          <Col className="column" xs={12} md={3}>
            <ColumnLeft />
          </Col>
          <Col className="column" xs={12} md={9}>
            <ErrorBoundary>
              <ColumnRight />
            </ErrorBoundary>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default App
