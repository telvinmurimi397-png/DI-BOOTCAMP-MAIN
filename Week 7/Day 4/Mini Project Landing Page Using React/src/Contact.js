import { useState } from 'react'

function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <section className="contact-section" id="contact" aria-labelledby="contact-title">
      <div className="container contact-layout">
        <div className="contact-details">
          <p className="section-kicker">Start a conversation</p>
          <h2 id="contact-title">Let’s make something meaningful.</h2>
          <p className="contact-intro">
            Tell us what you’re working on. We’ll get back to you within 24 hours.
          </p>
          <address className="contact-list">
            <p>
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <span>Company Name<br />Kampala, Uganda</span>
            </p>
            <a href="tel:+256778800900">
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <span>+256 778 800 900</span>
            </a>
            <a href="mailto:hello@company.com">
              <i className="fa-solid fa-envelope" aria-hidden="true" />
              <span>hello@company.com</span>
            </a>
          </address>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Contact us</h3>
          <label htmlFor="contact-email">Email address</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <label htmlFor="contact-message">How can we help?</label>
          <textarea
            id="contact-message"
            name="message"
            rows="4"
            placeholder="Tell us a little about your project..."
            required
          />
          <button type="submit" className="send-button">
            Send message <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
          {sent && <p className="form-success" role="status">Thanks for reaching out. We’ll be in touch soon.</p>}
        </form>
      </div>
    </section>
  )
}

export default Contact
