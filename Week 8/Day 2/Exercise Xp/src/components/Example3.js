import React from 'react'
import data from '../data/data.json'

class Example3 extends React.Component {
  render() {
    return (
      <section className="data-example">
        <p className="eyebrow">Example 3</p>
        <h3>Experience</h3>
        <div className="experience-list">
          {data.Experiences.map((experience) => (
            <div className="experience-entry" key={experience.companyName}>
              <img src={experience.logo} alt="" width="40" height="40" />
              <div>
                <h4><a href={experience.url} target="_blank" rel="noreferrer">{experience.companyName}</a></h4>
                {experience.roles.map((role) => (
                  <div className="role-entry" key={`${experience.companyName}-${role.title}`}>
                    <p><strong>{role.title}</strong> · {role.location}</p>
                    <p>{role.description}</p>
                    <p className="date-range">{role.startDate} — {role.endDate}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }
}

export default Example3