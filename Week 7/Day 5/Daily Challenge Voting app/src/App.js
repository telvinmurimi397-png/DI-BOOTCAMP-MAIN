import { useState } from 'react'

function App() {
  const [languages, setLanguages] = useState([
    { name: 'Php', votes: 0 },
    { name: 'Python', votes: 0 },
    { name: 'JavaScript', votes: 0 },
    { name: 'Java', votes: 0 },
  ])

  const voteForLanguage = (selectedLanguage) => {
    setLanguages((currentLanguages) =>
      currentLanguages.map((language) =>
        language.name === selectedLanguage
          ? { ...language, votes: language.votes + 1 }
          : language,
      ),
    )
  }

  return (
    <main className="voting-app">
      <h1>Vote Your Language!</h1>
      <div className="language-list">
        {languages.map((language) => (
          <article className="language-card" key={language.name}>
            <p className="vote-count">{language.votes}</p>
            <h2>{language.name}</h2>
            <button
              type="button"
              onClick={() => voteForLanguage(language.name)}
              aria-label={`Vote for ${language.name}`}
            >
              Click Here
            </button>
          </article>
        ))}
      </div>
    </main>
  )
}

export default App
