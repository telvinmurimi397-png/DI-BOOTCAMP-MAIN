import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react'

export interface ContactDetails {
  name: string
  email: string
}

export interface Contact extends ContactDetails {
  id: string
  note: string
}

interface ContactState {
  contacts: Contact[]
}

type ContactAction =
  | { type: 'addContact'; contact: Contact }
  | { type: 'removeContact'; id: string }

interface ContactContextValue {
  contacts: Contact[]
  dispatch: Dispatch<ContactAction>
  addContact: (details: Omit<Contact, 'id'>) => void
}

const initialState: ContactState = { contacts: [] }

function contactReducer(state: ContactState, action: ContactAction): ContactState {
  switch (action.type) {
    case 'addContact':
      return { contacts: [...state.contacts, action.contact] }
    case 'removeContact':
      return { contacts: state.contacts.filter((contact) => contact.id !== action.id) }
  }
}

const ContactContext = createContext<ContactContextValue | undefined>(undefined)

export function ContactProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(contactReducer, initialState)

  function addContact(details: Omit<Contact, 'id'>) {
    dispatch({ type: 'addContact', contact: { ...details, id: crypto.randomUUID() } })
  }

  return (
    <ContactContext.Provider value={{ contacts: state.contacts, dispatch, addContact }}>
      {children}
    </ContactContext.Provider>
  )
}

export function useContacts(): ContactContextValue {
  const context = useContext(ContactContext)
  if (!context) throw new Error('useContacts must be used within a ContactProvider.')
  return context
}
