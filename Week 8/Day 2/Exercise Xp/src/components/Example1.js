import React from 'react'
import data from '../data/data.json'

class Example1 extends React.Component {
  render() {
    return (
      <section className="data-example">
        <p className="eyebrow">Example 1</p>
        <h3>Social media</h3>
        <ul className="link-list">
          {data.SocialMedias.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">{url.replace(/https?:\/\//, '').replace(/\/$/, '')}</a>
            </li>
          ))}
        </ul>
      </section>
    )
  }
}

export default Example1