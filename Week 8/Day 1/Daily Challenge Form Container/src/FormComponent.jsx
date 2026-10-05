const destinations = ['Japan', 'Australia', 'Brazil', 'Canada']

const dietaryOptions = [
  { name: 'nutsFree', label: 'Nuts free' },
  { name: 'lactoseFree', label: 'Lactose free' },
  { name: 'vegan', label: 'Vegan' },
]

function FormComponent({ formData, handleChange }) {
  return (
    <div className="form-layout">
      <form className="travel-form" method="get" action="/">
        <div className="form-heading">
          <span className="step-label">TRAVEL PROFILE</span>
          <h2>Tell us about yourself</h2>
          <p>Share a few details so we can make your trip more comfortable.</p>
        </div>

        <div className="field-row">
          <label className="field">
            <span>First name</span>
            <input
              type="text"
              name="firstName"
              placeholder="e.g. John"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
          </label>
          <label className="field">
            <span>Last name</span>
            <input
              type="text"
              name="lastName"
              placeholder="e.g. Doe"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Age</span>
            <input
              type="number"
              name="age"
              min="1"
              max="120"
              placeholder="Your age"
              value={formData.age}
              onChange={handleChange}
              required
            />
          </label>
          <fieldset className="field gender-field">
            <legend>Gender</legend>
            <div className="choice-row">
              {['male', 'female'].map((gender) => (
                <label className="radio-choice" key={gender}>
                  <input
                    type="radio"
                    name="gender"
                    value={gender}
                    checked={formData.gender === gender}
                    onChange={handleChange}
                    required
                  />
                  <span>{gender === 'male' ? 'Male' : 'Female'}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <label className="field destination-field">
          <span>Destination</span>
          <select
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Choose your destination
            </option>
            {destinations.map((destination) => (
              <option value={destination} key={destination}>
                {destination}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="dietary-field">
          <legend>Dietary requirements</legend>
          <p>Select all that apply.</p>
          <div className="dietary-options">
            {dietaryOptions.map(({ name, label }) => (
              <label className="checkbox-choice" key={name}>
                <input
                  type="checkbox"
                  name={name}
                  checked={formData[name]}
                  onChange={handleChange}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="submit-button" type="submit">
          Submit travel details
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <aside className="preview-panel" aria-live="polite">
        <div className="preview-header">
          <span className="preview-icon" aria-hidden="true">✦</span>
          <div>
            <span className="step-label">LIVE PREVIEW</span>
            <h2>Your details</h2>
          </div>
        </div>

        <dl className="details-list">
          <div>
            <dt>First name</dt>
            <dd>{formData.firstName || '—'}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{formData.lastName || '—'}</dd>
          </div>
          <div>
            <dt>Age</dt>
            <dd>{formData.age || '—'}</dd>
          </div>
          <div>
            <dt>Gender</dt>
            <dd>{formData.gender || '—'}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>{formData.destination || '—'}</dd>
          </div>
          <div className="dietary-preview">
            <dt>Dietary requirements</dt>
            <dd>
              {dietaryOptions
                .filter(({ name }) => formData[name])
                .map(({ label }) => label)
                .join(', ') || 'None selected'}
            </dd>
          </div>
        </dl>
        <p className="preview-note">Your selections update here as you fill in the form.</p>
      </aside>
    </div>
  )
}

export default FormComponent
