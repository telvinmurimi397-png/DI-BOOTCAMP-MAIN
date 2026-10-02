import { useState } from 'react'

function Forms() {
  const [username, setUsername] = useState('')
  const [age, setAge] = useState(null)
  const [errormessage, setErrormessage] = useState('')
  const [textarea, setTextarea] = useState('The content of a textarea')
  const [car, setCar] = useState('Volvo')

  let header = null
  if (username && age !== null && !errormessage) {
    header = (
      <h2>
        Your name is {username} and your age is {age}
      </h2>
    )
  }

  const handleInputChange = (event) => {
    const { name, value } = event.currentTarget

    if (name === 'username') {
      setUsername(value)
      return
    }

    setAge(value === '' ? null : value)
    setErrormessage(
      value.trim() !== '' && Number.isNaN(Number(value))
        ? 'Age must be a number'
        : '',
    )
  }

  const mySubmitHandler = (event) => {
    event.preventDefault()
    window.alert(username)
  }

  return (
    <div className="exercise-content">
      {header}

      <form className="exercise-form" onSubmit={mySubmitHandler}>
        <label>
          Name:
          <input
            type="text"
            name="username"
            value={username}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Age:
          <input
            type="text"
            inputMode="numeric"
            name="age"
            value={age ?? ''}
            onChange={handleInputChange}
            aria-invalid={Boolean(errormessage)}
            aria-describedby={errormessage ? 'age-error' : undefined}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
      {errormessage && (
        <p className="error-message" id="age-error" role="alert">
          {errormessage}
        </p>
      )}

      <section className="form-section">
        <h2>Textarea</h2>
        <textarea
          value={textarea}
          onChange={(event) => setTextarea(event.currentTarget.value)}
          rows="4"
          cols="40"
        />
      </section>

      <section className="form-section">
        <h2>Select a car</h2>
        <label>
          Car:
          <select
            value={car}
            onChange={(event) => setCar(event.currentTarget.value)}
          >
            <option value="Volvo">Volvo</option>
            <option value="Saab">Saab</option>
            <option value="Mercedes">Mercedes</option>
            <option value="Audi">Audi</option>
          </select>
        </label>
        <p>Selected car: {car}</p>
      </section>
    </div>
  )
}

export default Forms
