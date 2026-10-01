import React, { Component } from 'react'
import './Exercise.css'

class Exercise extends Component {
  render() {
    const style_header = {
      color: 'white',
      backgroundColor: 'DodgerBlue',
      padding: '10px',
      fontFamily: 'Arial',
    }

    return (
      <div className="exercise-content">
        <h1 style={style_header}>This is a header</h1>
        <p className="para">This is a paragraph.</p>
        <a href="https://react.dev/">Visit the React website</a>
        <form className="exercise-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" />
          <button type="submit">Submit</button>
        </form>
        <img
          className="exercise-image"
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80"
          alt="Mountain landscape under a bright sky"
        />
        <ul>
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
      </div>
    )
  }
}

export default Exercise
