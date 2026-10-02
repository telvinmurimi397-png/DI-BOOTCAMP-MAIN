import Clock from './Components/Clock.js'
import Form from './Components/Form.js'

function App() {
  return (
    <main className="page">
      <section className="panel clock-panel">
        <h1>Local Time</h1>
        <Clock />
      </section>

      <section className="panel">
        <h2>Form Validation</h2>
        <Form />
      </section>
    </main>
  )
}

export default App
