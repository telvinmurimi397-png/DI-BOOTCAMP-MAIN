import { useState } from 'react'

type StringFields<T> = { [K in keyof T]: string }

export type FormErrors<T extends StringFields<T>> = Partial<Record<keyof T, string>>
export type FormValidator<T extends StringFields<T>> = (values: T) => FormErrors<T>

interface UseFormOptions<T extends StringFields<T>> {
  initialValues: T
  validate: FormValidator<T>
}

interface UseFormResult<T extends StringFields<T>> {
  values: T
  errors: FormErrors<T>
  touched: Partial<Record<keyof T, boolean>>
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  setFieldTouched: (field: keyof T) => void
  validateForm: () => boolean
  resetForm: () => void
}

function useForm<T extends StringFields<T>>({
  initialValues,
  validate,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  function setFieldValue<K extends keyof T>(field: K, value: T[K]) {
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    setErrors(validate(nextValues))
  }

  function setFieldTouched(field: keyof T) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function validateForm() {
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setTouched(Object.keys(values).reduce<Partial<Record<keyof T, boolean>>>((all, key) => {
      all[key as keyof T] = true
      return all
    }, {}))
    return Object.keys(nextErrors).length === 0
  }

  function resetForm() {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, setFieldValue, setFieldTouched, validateForm, resetForm }
}

export default useForm
