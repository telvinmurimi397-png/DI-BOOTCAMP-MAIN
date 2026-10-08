import { useState } from 'react'

const operations = {
  add: { label: 'Addition', symbol: '+', calculate: (a, b) => a + b },
  subtract: { label: 'Subtraction', symbol: '−', calculate: (a, b) => a - b },
  multiply: { label: 'Multiplication', symbol: '×', calculate: (a, b) => a * b },
  divide: { label: 'Division', symbol: '÷', calculate: (a, b) => a / b },
}

function App() {
  const [firstNumber, setFirstNumber] = useState('')
  const [secondNumber, setSecondNumber] = useState('')
  const [operation, setOperation] = useState('add')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function handleCalculate(event) {
    event.preventDefault()
    setResult(null)
    setError('')

    if (firstNumber.trim() === '' || secondNumber.trim() === '') {
      setError('Enter both numbers to calculate.')
      return
    }

    const first = Number(firstNumber)
    const second = Number(secondNumber)

    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      setError('Enter valid numbers to calculate.')
      return
    }

    if (operation === 'divide' && second === 0) {
      setError('A number cannot be divided by zero.')
      return
    }

    const answer = operations[operation].calculate(first, second)

    if (!Number.isFinite(answer)) {
      setError('The result is outside the range of supported numbers.')
      return
    }

    setResult(answer)
  }

  function clearResult() {
    setResult(null)
    setError('')
  }

  const formattedResult =
    result === null
      ? null
      : new Intl.NumberFormat(undefined, {
          maximumFractionDigits: 10,
        }).format(result)

  return (
    <main className="page">
      <div className="calculator-wrap">
        <header className="page-heading">
          <span className="heading-icon" aria-hidden="true">
            ＋
          </span>
          <p className="eyebrow">Daily challenge</p>
          <h1>Calculator</h1>
          <p className="intro">
            A couple of numbers. One quick answer.
          </p>
        </header>

        <form className="calculator-card" onSubmit={handleCalculate}>
          <div className="field-group">
            <label htmlFor="first-number">First number</label>
            <input
              id="first-number"
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 24"
              value={firstNumber}
              onChange={(event) => {
                setFirstNumber(event.target.value)
                clearResult()
              }}
            />
          </div>

          <div className="operation-row">
            <span className="operation-line" aria-hidden="true" />
            <label className="visually-hidden" htmlFor="operation">
              Choose an operation
            </label>
            <select
              id="operation"
              value={operation}
              onChange={(event) => {
                setOperation(event.target.value)
                clearResult()
              }}
            >
              {Object.entries(operations).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.symbol} {item.label}
                </option>
              ))}
            </select>
            <span className="operation-line" aria-hidden="true" />
          </div>

          <div className="field-group">
            <label htmlFor="second-number">Second number</label>
            <input
              id="second-number"
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="e.g. 18"
              value={secondNumber}
              onChange={(event) => {
                setSecondNumber(event.target.value)
                clearResult()
              }}
            />
          </div>

          <button className="calculate-button" type="submit">
            Calculate
            <span aria-hidden="true"> →</span>
          </button>

          {error && (
            <p className="feedback error" role="alert">
              {error}
            </p>
          )}

          {result !== null && (
            <section className="result" aria-live="polite" aria-atomic="true">
              <p className="result-label">Your result</p>
              <p className="result-value">{formattedResult}</p>
              <p className="result-equation">
                {firstNumber} {operations[operation].symbol} {secondNumber}
              </p>
            </section>
          )}
        </form>

        <p className="page-footer">Simple math, done.</p>
      </div>
    </main>
  )
}

export default App
