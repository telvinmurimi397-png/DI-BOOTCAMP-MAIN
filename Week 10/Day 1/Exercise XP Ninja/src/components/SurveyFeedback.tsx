import { useReducer } from 'react'
import { initialSurveyState, surveyReducer } from '../reducers/surveyReducer'

function SurveyFeedback() {
  const [state, dispatch] = useReducer(surveyReducer, initialSurveyState)

  async function submitSurvey() {
    dispatch({ type: 'submit' })
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    dispatch({ type: 'complete' })
  }

  return (
    <div className="panel-body survey-body">
      {!state.hasStarted && (
        <div className="survey-intro">
          <p className="component-description">Take a moment to reflect on your TypeScript progress.</p>
          <button className="button button-dark" type="button" onClick={() => dispatch({ type: 'start' })}>
            Start the survey <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
      {state.hasStarted && state.status === 'initial' && (
        <>
          <p className="component-description">How are you finding TypeScript so far?</p>
          <textarea
            value={state.feedback}
            onChange={(event) => dispatch({ type: 'changeFeedback', feedback: event.target.value })}
            placeholder="Share a quick thought…"
            rows={3}
            aria-label="Survey feedback"
          />
          <button className="button button-dark" type="button" disabled={!state.feedback.trim()} onClick={() => void submitSurvey()}>
            Submit feedback <span aria-hidden="true">↗</span>
          </button>
        </>
      )}
      {state.status === 'submitting' && <p className="inline-status" role="status"><span className="spinner" /> Sending your response…</p>}
      {state.status === 'completed' && (
        <div className="completed-response" role="status">
          <span className="success-mark">✓</span>
          <div><strong>Thanks for sharing.</strong><p>“{state.feedback}”</p></div>
          <button className="text-button" type="button" onClick={() => dispatch({ type: 'reset' })}>Start over</button>
        </div>
      )}
    </div>
  )
}

export default SurveyFeedback
