import React from 'react'
import data from '../data/data.json'

class Example2 extends React.Component {
  render() {
    return (
      <section className="data-example">
        <p className="eyebrow">Example 2</p>
        <h3>Skills</h3>
        {data.Skills.map((group) => (
          <div className="skill-group" key={group.Area}>
            <h4>{group.Area}</h4>
            <ul className="skill-list">
              {group.SkillSet.map((skill) => (
                <li key={skill.Name}>
                  {skill.Name}{skill.Hot && <span className="skill-highlight">In focus</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    )
  }
}

export default Example2