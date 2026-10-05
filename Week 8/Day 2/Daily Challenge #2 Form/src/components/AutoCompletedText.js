import React from 'react'
import countries from '../data/countries.js'

class AutoCompletedText extends React.Component {
  state = {
    suggestions: [],
    text: '',
  }

  handleTextChange = (event) => {
    const text = event.target.value
    const suggestions = text.trim()
      ? countries.filter((country) => country.toLowerCase().includes(text.trim().toLowerCase()))
      : []

    this.setState({ suggestions, text })
  }

  handleSuggestionClick = (country) => {
    this.setState({ text: country, suggestions: [] })
  }

  render() {
    const { suggestions, text } = this.state

    return (
      <div className="autocomplete">
        <label className="search-label" htmlFor="country-search">Country</label>
        <input
          id="country-search"
          className="search-input"
          type="text"
          value={text}
          onChange={this.handleTextChange}
          placeholder="Start typing a country..."
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="country-suggestions"
          aria-expanded={suggestions.length > 0}
        />
        {suggestions.length > 0 && (
          <ul className="suggestions" id="country-suggestions">
            {suggestions.map((country) => (
              <li key={country}>
                <button type="button" onClick={() => this.handleSuggestionClick(country)}>
                  {country}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

export default AutoCompletedText