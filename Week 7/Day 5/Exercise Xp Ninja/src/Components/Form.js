import { useState } from 'react'
import Input from './Input.js'

const initialValues = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[\d\s().-]+$/

function validate(values) {
  const errors = {}

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.'
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required.'
  }

  const phoneDigits = values.phone.replace(/\D/g, '')
  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else if (
    !phonePattern.test(values.phone.trim()) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    errors.phone = 'Enter a valid phone number.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

function Form() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.currentTarget
    setValues((currentValues) => ({ ...currentValues, [name]: value }))
    setSubmitted(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    setSubmitted(Object.keys(validationErrors).length === 0)
  }

  return (
    <form className="validation-form" onSubmit={handleSubmit} noValidate>
      <Input
        id="first-name"
        label="First Name"
        name="firstName"
        value={values.firstName}
        onChange={handleChange}
        error={errors.firstName}
        autoComplete="given-name"
      />
      <Input
        id="last-name"
        label="Last Name"
        name="lastName"
        value={values.lastName}
        onChange={handleChange}
        error={errors.lastName}
        autoComplete="family-name"
      />
      <Input
        id="phone"
        label="Phone"
        name="phone"
        value={values.phone}
        onChange={handleChange}
        error={errors.phone}
        type="tel"
        autoComplete="tel"
      />
      <Input
        id="email"
        label="Email"
        name="email"
        value={values.email}
        onChange={handleChange}
        error={errors.email}
        type="text"
        inputMode="email"
        autoComplete="email"
      />
      <button type="submit">Submit</button>
      {submitted && (
        <p className="success-message" role="status">
          Form submitted successfully.
        </p>
      )}
    </form>
  )
}

export default Form
