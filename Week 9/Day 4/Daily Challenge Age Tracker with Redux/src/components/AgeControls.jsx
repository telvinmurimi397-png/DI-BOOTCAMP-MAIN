import { useDispatch, useSelector } from 'react-redux'
import { ageDownAsync, ageUpAsync } from '../redux/ageSlice.js'

function AgeControls() {
  const dispatch = useDispatch()
  const { age, loading } = useSelector((state) => state.age)

  return (
    <form className="age-controls" onSubmit={(event) => event.preventDefault()}>
      <button
        className="control-button secondary-button"
        type="button"
        disabled={loading || age === 0}
        onClick={() => dispatch(ageDownAsync())}
      >
        <span aria-hidden="true">−</span>
        Age Down
      </button>
      <button
        className="control-button primary-button"
        type="button"
        disabled={loading}
        onClick={() => dispatch(ageUpAsync())}
      >
        Age Up
        <span aria-hidden="true">+</span>
      </button>
    </form>
  )
}

export default AgeControls
