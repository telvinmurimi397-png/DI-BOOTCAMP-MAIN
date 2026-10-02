import BookForm from './Components/BookForm.js'
import UserForm from './Components/UserForm.js'

function App() {
  return (
    <main className="page">
      <h1>React Forms</h1>

      <section className="lesson-section">
        <h2>Exercise 1: Use data from a form</h2>
        <BookForm />
      </section>

      <section className="lesson-section">
        <h2>Exercise 2: Display form input</h2>
        <UserForm />
      </section>
    </main>
  )
}

export default App
