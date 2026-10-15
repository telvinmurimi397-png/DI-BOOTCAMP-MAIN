import { useSelector } from 'react-redux'

function AgeDisplay() {
  const { age, loading } = useSelector((state) => state.age)

  return (
    <div className="age-display" aria-live="polite" aria-busy={loading}>
      <span className="age-label">CURRENT AGE</span>
      <div className="age-value-wrap">
        <span className={`age-value${loading ? ' is-loading' : ''}`}>{age}</span>
        {loading && <span className="loader" role="status" aria-label="Updating age" />}
      </div>
      <span className="age-unit">{age === 1 ? 'year old' : 'years old'}</span>
    </div>
  )
}

export default AgeDisplay
