import React from 'react'
import FormComponent from './FormComponent.jsx'

function getInitialFormData() {
  const params = new URLSearchParams(window.location.search)
  const gender = params.get('gender')
  const destinations = ['Japan', 'Australia', 'Brazil', 'Canada']

  return {
    firstName: params.get('firstName') ?? '',
    lastName: params.get('lastName') ?? '',
    age: params.get('age') ?? '',
    gender: gender === 'male' || gender === 'female' ? gender : '',
    destination: destinations.includes(params.get('destination')) ? params.get('destination') : '',
    nutsFree: params.has('nutsFree'),
    lactoseFree: params.has('lactoseFree'),
    vegan: params.has('vegan'),
  }
}

class App extends React.Component {
  state = {
    formData: getInitialFormData(),
  }

  handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    this.setState(({ formData }) => ({
      formData: {
        ...formData,
        [name]: nextValue,
      },
    }))
  }

  render() {
    return (
      <main className="page">
        <header className="page-header">
          <div className="brand-mark" aria-hidden="true">✦</div>
          <div>
            <p className="eyebrow">DAILY CHALLENGE</p>
            <h1>Travel details</h1>
          </div>
        </header>
        <FormComponent formData={this.state.formData} handleChange={this.handleChange} />
        <footer className="page-footer">Your next trip starts with a few details.</footer>
      </main>
    )
  }
}

export default App
