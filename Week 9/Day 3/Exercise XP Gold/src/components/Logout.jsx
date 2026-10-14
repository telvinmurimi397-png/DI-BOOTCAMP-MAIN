import { useDispatch } from 'react-redux'
import { logoutUser } from '../redux/authSlice.js'

function Logout() {
  const dispatch = useDispatch()

  return (
    <button className="logout-button" onClick={() => dispatch(logoutUser())} type="button">
      Sign out
      <span aria-hidden="true">↗</span>
    </button>
  )
}

export default Logout
