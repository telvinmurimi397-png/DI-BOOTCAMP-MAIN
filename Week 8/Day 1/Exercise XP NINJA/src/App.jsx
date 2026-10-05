import React from 'react'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getClockDate() {
  const now = new Date()

  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    weekday: now.getDay(),
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
  }
}

function pad(value) {
  return String(value).padStart(2, '0')
}

class Clock extends React.Component {
  state = getClockDate()

  componentDidMount() {
    this.intervalId = window.setInterval(() => {
      this.setState(getClockDate())
    }, 1000)
  }

  componentWillUnmount() {
    window.clearInterval(this.intervalId)
  }

  render() {
    const { year, month, weekday, day, hour, minute, second } = this.state

    return (
      <main className="page">
        <header className="page-header">
          <span className="live-indicator" aria-hidden="true" />
          <p>Local time · Live</p>
        </header>

        <section className="clock-card" aria-label="Current date and time">
          <div className="clock-face">
            <div className="face-grid" aria-hidden="true" />
            <div className="face-ring face-ring-outer" aria-hidden="true" />
            <div className="face-ring face-ring-inner" aria-hidden="true" />

            <div className="compass-label label-year">
              <span className="label-name">Year</span>
              <span className="label-value">{year}</span>
            </div>
            <div className="compass-label label-weekday">
              <span className="label-name">Weekday</span>
              <span className="label-value">{weekdays[weekday]}</span>
            </div>
            <div className="compass-label label-day">
              <span className="label-name">Day</span>
              <span className="label-value">{pad(day)}</span>
            </div>
            <div className="compass-label label-month">
              <span className="label-name">Month</span>
              <span className="label-value">{months[month]}</span>
            </div>
            <div className="compass-label label-hour">
              <span className="label-name">Hour</span>
              <span className="label-value">{pad(hour)}</span>
            </div>
            <div className="compass-label label-minute">
              <span className="label-name">Minute</span>
              <span className="label-value">{pad(minute)}</span>
            </div>
            <div className="compass-label label-second">
              <span className="label-name">Second</span>
              <span className="label-value">{pad(second)}</span>
            </div>
            <div className="clock-center">
              <div className="time-display" aria-live="off">
                {pad(hour)}:{pad(minute)}<span>:{pad(second)}</span>
              </div>
              <div className="date-display">
                {weekdays[weekday]}, {months[month]} {day}
              </div>
              <div className="center-caption">HOUR · MINUTE · SECOND</div>
            </div>
          </div>

          <footer className="clock-footer">
            <span>CALENDAR</span>
            <span className="footer-month">{months[month]}</span>
            <span>{year}</span>
          </footer>
        </section>

        <p className="page-note">A little time, mapped like a compass.</p>
      </main>
    )
  }
}

function App() {
  return <Clock />
}

export default App
