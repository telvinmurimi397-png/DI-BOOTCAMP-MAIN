import Header from './Header.js'
import Card from './Card.js'
import Contact from './Contact.js'

const companySections = [
  {
    id: 'about',
    icon: 'fa-solid fa-building',
    title: 'About the Company',
    text: 'We bring thoughtful people and practical ideas together to help organisations do their best work. From the first conversation to the final detail, we make progress feel clear and achievable.',
  },
  {
    id: 'values',
    icon: 'fa-solid fa-earth-africa',
    title: 'Our Values',
    text: 'We lead with curiosity, act with care, and make room for different perspectives. Good work should be honest, useful, and built to last for the communities it serves.',
  },
  {
    id: 'mission',
    icon: 'fa-solid fa-landmark',
    title: 'Our Mission',
    text: 'Our mission is to turn ambition into meaningful outcomes. We help teams find the next right step, build momentum, and create work they can be proud to put into the world.',
  },
]

function App() {
  return (
    <>
      <Header />
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-content container">
            <p className="hero-kicker">Good ideas, put to work</p>
            <h1 id="hero-title">We specialise in making progress matter.</h1>
            <p className="hero-copy">
              Thoughtful people. Practical solutions. A better way forward.
            </p>
            <a className="hero-link" href="#about">
              Get to know us <i className="fa-solid fa-arrow-down" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="company-sections container" aria-label="About our company">
          {companySections.map((section) => (
            <Card key={section.id} {...section} />
          ))}
        </section>

        <Contact />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>Company</span>
          <span>Thoughtful work. Lasting impact.</span>
          <a href="#top" aria-label="Back to top">
            Back to top <i className="fa-solid fa-arrow-up" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </>
  )
}

export default App
