function Card({ id, icon, title, text }) {
  return (
    <article className="company-card" id={id}>
      <span className="card-icon" aria-hidden="true">
        <i className={icon} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <a className="card-link" href="#contact">
        Let’s talk <i className="fa-solid fa-arrow-right" aria-hidden="true" />
      </a>
    </article>
  )
}

export default Card
