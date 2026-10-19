import { useReducer, useState, type FormEvent } from 'react'
import { initialContactFormState, contactFormReducer } from '../reducers/contactFormReducer'
import { useContacts } from '../context/ContactContext'

function ContactForm() {
  const [form, dispatch] = useReducer(contactFormReducer, initialContactFormState)
  const [message, setMessage] = useState<string | null>(null)
  const { addContact } = useContacts()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return
    addContact({ name: form.name.trim(), email: form.email.trim(), note: form.message.trim() })
    dispatch({ type: 'resetForm' })
    setMessage('Contact added to your shared contact book.')
  }

  return (
    <form className="panel-body stacked-form" onSubmit={handleSubmit}>
      <label className="field-label">NAME
        <input value={form.name} onChange={(event) => dispatch({ type: 'updateField', field: 'name', value: event.target.value })} placeholder="Contact name" required />
      </label>
      <label className="field-label">EMAIL
        <input type="email" value={form.email} onChange={(event) => dispatch({ type: 'updateField', field: 'email', value: event.target.value })} placeholder="contact@example.com" required />
      </label>
      <label className="field-label">MESSAGE
        <textarea value={form.message} onChange={(event) => dispatch({ type: 'updateField', field: 'message', value: event.target.value })} placeholder="What should you remember?" rows={2} required />
      </label>
      <div className="action-row">
        <button className="button button-dark" type="submit">Add contact <span aria-hidden="true">↗</span></button>
        <button className="text-button" type="button" onClick={() => { dispatch({ type: 'resetForm' }); setMessage(null) }}>Reset fields</button>
      </div>
      <p className="form-feedback" aria-live="polite">{message ?? 'Fields are managed by one typed reducer.'}</p>
    </form>
  )
}

export default ContactForm
