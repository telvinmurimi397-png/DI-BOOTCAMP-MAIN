import Exercise from './Exercise3.js'
import UserFavoriteAnimals from './UserFavoriteAnimals.js'

const user = {
  firstName: 'Bob',
  lastName: 'Dylan',
  favAnimals: ['Horse', 'Turtle', 'Elephant', 'Monkey'],
}

const myelement = <h1>I Love JSX!</h1>
const sum = 5 + 5

function App() {
  return (
    <main className="page">
      <section className="lesson-section">
        <p>Hello World!</p>
        {myelement}
        <p>React is {sum} times better with JSX</p>
      </section>

      <section className="lesson-section">
        <h2>User</h2>
        <h3>{user.firstName}</h3>
        <h3>{user.lastName}</h3>
        <UserFavoriteAnimals favAnimals={user.favAnimals} />
      </section>

      <section className="lesson-section">
        <h2>HTML Tags in React</h2>
        <Exercise />
      </section>
    </main>
  )
}

export default App
