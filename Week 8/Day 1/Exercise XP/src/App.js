import React from 'react'
import ErrorBoundary from './ErrorBoundary.js'

class BuggyCounter extends React.Component {
  state = { counter: 0 }

  handleClick = () => {
    this.setState(({ counter }) => ({ counter: counter + 1 }))
  }

  render() {
    if (this.state.counter >= 5) {
      throw new Error('I crashed!')
    }

    return (
      <button className="counter-button" onClick={this.handleClick}>
        Click me: {this.state.counter}
      </button>
    )
  }
}

class FavoriteColor extends React.Component {
  state = { favoriteColor: 'red' }

  componentDidMount() {
    this.colorTimer = window.setTimeout(() => {
      this.setState({ favoriteColor: 'yellow' })
    }, 1500)
  }

  componentWillUnmount() {
    window.clearTimeout(this.colorTimer)
  }

  shouldComponentUpdate() {
    return true
  }

  getSnapshotBeforeUpdate() {
    console.log('in getSnapshotBeforeUpdate')
    return null
  }

  componentDidUpdate() {
    console.log('after update')
  }

  changeColor = () => {
    this.setState({ favoriteColor: 'blue' })
  }

  render() {
    return (
      <div className="color-demo">
        <p>
          My favorite color is <strong style={{ color: this.state.favoriteColor }}>{this.state.favoriteColor}</strong>
        </p>
        <button className="secondary-button" onClick={this.changeColor}>
          Change color to blue
        </button>
        <p className="hint">It changes to yellow after mounting. Lifecycle logs appear in the browser console.</p>
      </div>
    )
  }
}

class Child extends React.Component {
  componentWillUnmount() {
    window.alert('The Child component is about to unmount.')
  }

  render() {
    return <h3 className="hello-world">Hello World!</h3>
  }
}

class App extends React.Component {
  state = {
    simulation: 'shared',
    show: true,
  }

  selectSimulation = (event) => {
    this.setState({ simulation: event.target.value })
  }

  deleteChild = () => {
    this.setState({ show: false })
  }

  renderSimulation() {
    switch (this.state.simulation) {
      case 'separate':
        return (
          <div className="counter-row">
            <ErrorBoundary>
              <BuggyCounter />
            </ErrorBoundary>
            <ErrorBoundary>
              <BuggyCounter />
            </ErrorBoundary>
          </div>
        )
      case 'unprotected':
        return <BuggyCounter />
      default:
        return (
          <ErrorBoundary>
            <div className="counter-row">
              <BuggyCounter />
              <BuggyCounter />
            </div>
          </ErrorBoundary>
        )
    }
  }

  render() {
    return (
      <main className="page">
        <header className="page-header">
          <p className="eyebrow">Week 8 · Day 1</p>
          <h1>React Lifecycle &amp; Error Boundaries</h1>
          <p>Explore render errors, update lifecycle methods, and component unmounting.</p>
        </header>

        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Exercise 1</p>
              <h2>Error Boundary Simulations</h2>
            </div>
            <label className="simulation-picker">
              Simulation
              <select value={this.state.simulation} onChange={this.selectSimulation}>
                <option value="shared">1 · Shared boundary</option>
                <option value="separate">2 · Separate boundaries</option>
                <option value="unprotected">3 · No boundary</option>
              </select>
            </label>
          </div>
          <p className="description">
            Click each counter five times. When an unprotected counter crashes, the app tree will be removed as
            expected; reload the page to try another simulation.
          </p>
          <div className="demo-area">{this.renderSimulation()}</div>
        </section>

        <section className="lesson-section">
          <p className="eyebrow">Exercise 2</p>
          <h2>Updating Lifecycle</h2>
          <FavoriteColor />
        </section>

        <section className="lesson-section">
          <p className="eyebrow">Exercise 3</p>
          <h2>Unmounting Lifecycle</h2>
          <div className="unmount-demo">
            {this.state.show ? <Child /> : <p className="hint">The child component has been removed.</p>}
            {this.state.show && (
              <button className="secondary-button delete-button" onClick={this.deleteChild}>
                Delete
              </button>
            )}
          </div>
        </section>
      </main>
    )
  }
}

export default App
