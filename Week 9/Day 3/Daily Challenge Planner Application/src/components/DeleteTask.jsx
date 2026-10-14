import { useDispatch, useSelector } from 'react-redux'
import { deleteTask } from '../redux/plannerSlice.js'

function DeleteTask({ taskId, taskTitle }) {
  const selectedDate = useSelector((state) => state.planner.selectedDate)
  const dispatch = useDispatch()

  return (
    <button
      className="delete-action"
      type="button"
      onClick={() => dispatch(deleteTask({ date: selectedDate, taskId }))}
      aria-label={`Delete ${taskTitle}`}
      title="Delete task"
    >
      Delete
    </button>
  )
}

export default DeleteTask
