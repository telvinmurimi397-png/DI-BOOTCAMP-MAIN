import { useState, type FormEvent } from 'react'
import useForm, { type FormErrors } from '../hooks/useForm'

interface RegistrationValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

const initialValues: RegistrationValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function validateRegistration(values: RegistrationValues): FormErrors<RegistrationValues> {
  const errors: FormErrors<RegistrationValues> = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (values.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Your passwords do not match.'
  return errors
}

function RegistrationForm() {
  const { values, errors, touched, setFieldValue, setFieldTouched, validateForm, resetForm } = useForm({
    initialValues,
    validate: validateRegistration,
  })
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (values.email.endsWith('@error.test')) {
            reject(new Error('The registration service rejected this address. Try another email.'))
          } else {
            resolve()
          }
        }, 500)
      })
      setStatus({ kind: 'success', message: `You're on the list, ${values.name.trim()}!` })
      resetForm()
    } catch (submissionError: unknown) {
      setStatus({
        kind: 'error',
        message: submissionError instanceof Error ? submissionError.message : 'Registration failed. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function fieldError(field: keyof RegistrationValues) {
    return touched[field] ? errors[field] : undefined
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      <div className="form-fields">
        <label className="form-field">
          <span>NAME</span>
          <input
            autoComplete="name"
            value={values.name}
            onChange={(event) => setFieldValue('name', event.target.value)}
            onBlur={() => setFieldTouched('name')}
            aria-invalid={Boolean(fieldError('name'))}
            aria-describedby={fieldError('name') ? 'name-error' : undefined}
            placeholder="Your name"
          />
          {fieldError('name') && <small className="field-error" id="name-error">{fieldError('name')}</small>}
        </label>
        <label className="form-field">
          <span>EMAIL ADDRESS</span>
          <input
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setFieldValue('email', event.target.value)}
            onBlur={() => setFieldTouched('email')}
            aria-invalid={Boolean(fieldError('email'))}
            aria-describedby={fieldError('email') ? 'email-error' : undefined}
            placeholder="you@example.com"
          />
          {fieldError('email') && <small className="field-error" id="email-error">{fieldError('email')}</small>}
        </label>
        <label className="form-field">
          <span>PASSWORD</span>
          <input
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => setFieldValue('password', event.target.value)}
            onBlur={() => setFieldTouched('password')}
            aria-invalid={Boolean(fieldError('password'))}
            aria-describedby={fieldError('password') ? 'password-error' : undefined}
            placeholder="At least 8 characters"
          />
          {fieldError('password') && <small className="field-error" id="password-error">{fieldError('password')}</small>}
        </label>
        <label className="form-field">
          <span>CONFIRM PASSWORD</span>
          <input
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => setFieldValue('confirmPassword', event.target.value)}
            onBlur={() => setFieldTouched('confirmPassword')}
            aria-invalid={Boolean(fieldError('confirmPassword'))}
            aria-describedby={fieldError('confirmPassword') ? 'confirm-password-error' : undefined}
            placeholder="Re-enter your password"
          />
          {fieldError('confirmPassword') && <small className="field-error" id="confirm-password-error">{fieldError('confirmPassword')}</small>}
        </label>
      </div>
      <div className="form-submit-row">
        <p className="form-hint">Tip: <code>@error.test</code> shows the server error state.</p>
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'} <span aria-hidden="true">↗</span>
        </button>
      </div>
      {status && <p className={`form-status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>{status.message}</p>}
    </form>
  )
}

export default RegistrationForm
