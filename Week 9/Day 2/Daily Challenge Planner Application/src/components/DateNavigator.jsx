import { connect } from 'react-redux'
import { selectDate } from '../redux/actions.js'
import { addDays, formatDayLabel, getWeekDates, toDateKey } from '../dateUtils.js'

function DateNavigator({ selectedDate, selectDate }) {
  const dates = getWeekDates(selectedDate)
  const monthLabel = formatDayLabel(selectedDate, { month: 'long', year: 'numeric' })
  const today = toDateKey(new Date())

  return (
    <section className="date-panel" aria-label="Choose a day">
      <div className="date-panel-top">
        <div>
          <p className="section-kicker">YOUR WEEK</p>
          <h2>{monthLabel}</h2>
        </div>
        <div className="date-tools">
          <button className="today-button" type="button" onClick={() => selectDate(today)}>Today</button>
          <label className="date-input-wrap" title="Choose a date">
            <span className="sr-only">Choose a date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => event.target.value && selectDate(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="week-navigation">
        <button className="week-arrow" type="button" onClick={() => selectDate(toDateKey(addDays(new Date(`${selectedDate}T12:00:00`), -7)))} aria-label="Previous week" title="Previous week">‹</button>
        <div className="week-strip" role="group" aria-label="Days of the week">
          {dates.map((date) => {
            const dateKey = toDateKey(date)
            const isSelected = dateKey === selectedDate
            return (
              <button
                key={dateKey}
                className={`day-button${isSelected ? ' is-selected' : ''}${dateKey === today ? ' is-today' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectDate(dateKey)}
              >
                <span className="day-name">{formatDayLabel(dateKey, { weekday: 'short' })}</span>
                <span className="day-number">{date.getDate()}</span>
                {dateKey === today && <span className="today-dot" aria-label="Today" />}
              </button>
            )
          })}
        </div>
        <button className="week-arrow" type="button" onClick={() => selectDate(toDateKey(addDays(new Date(`${selectedDate}T12:00:00`), 7)))} aria-label="Next week" title="Next week">›</button>
      </div>
    </section>
  )
}

const mapStateToProps = (state) => ({ selectedDate: state.selectedDate })

export default connect(mapStateToProps, { selectDate })(DateNavigator)
