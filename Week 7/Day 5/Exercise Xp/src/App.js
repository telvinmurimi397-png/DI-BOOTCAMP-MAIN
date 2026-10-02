import Car from './Components/Car.js'
import Events from './Components/Events.js'
import Phone from './Components/Phone.js'
import Color from './Components/Color.js'

const carinfo = { name: 'Ford', model: 'Mustang' }

function App() {
  return (
    <main className="page">
      <h1>React Exercises XP</h1>

      <section className="lesson-section">
        <h2>Exercise 1: Car and components</h2>
        <Car carInfo={carinfo} />
      </section>

      <section className="lesson-section">
        <h2>Exercise 2: Events</h2>
        <Events />
      </section>

      <section className="lesson-section">
        <h2>Exercise 3: Phone</h2>
        <Phone />
      </section>

      <section className="lesson-section">
        <h2>Exercise 4: useEffect</h2>
        <Color />
      </section>
    </main>
  )
}

export default App
