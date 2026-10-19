import { useContacts } from '../context/ContactContext'

function ContactList() {
  const { contacts, dispatch } = useContacts()

  return (
    <div className="panel-body contact-list-body">
      {contacts.length === 0
        ? <p className="empty-contacts">Your contact book is empty. Add someone using the form above.</p>
        : <ul className="contact-list">
            {contacts.map((contact) => (
              <li className="contact-item" key={contact.id}>
                <span className="contact-avatar" aria-hidden="true">{contact.name.charAt(0).toUpperCase()}</span>
                <span className="contact-copy"><strong>{contact.name}</strong><span>{contact.email}</span><small>{contact.note}</small></span>
                <button className="remove-contact" type="button" aria-label={`Remove ${contact.name}`} onClick={() => dispatch({ type: 'removeContact', id: contact.id })}>×</button>
              </li>
            ))}
          </ul>}
      <p className="contact-count">{contacts.length} {contacts.length === 1 ? 'CONTACT' : 'CONTACTS'} IN SHARED STATE</p>
    </div>
  )
}

export default ContactList
