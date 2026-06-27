import { useId } from 'react'
import { useExerciseSearch } from '../hooks/useExerciseSearch'

interface Props {
  value: string
  onChange: (name: string) => void
  placeholder?: string
  className?: string
}

/**
 * Exercise-name input with wger-backed autocomplete via a native <datalist>.
 * Suggestions update as the user types (debounced); picking one fills the input.
 */
export default function ExerciseAutocomplete({ value, onChange, placeholder, className }: Props) {
  const listId = useId()
  const { suggestions } = useExerciseSearch(value)

  return (
    <>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Exercise name (e.g., Bench Press)'}
        className={className ?? 'input-base flex-1'}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s.id} value={s.name}>
            {s.category ?? ''}
          </option>
        ))}
      </datalist>
    </>
  )
}
