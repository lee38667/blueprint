interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps) {
  const toggleId = id || `toggle-${label?.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={toggleId} className="text-sm cursor-pointer" style={{ color: 'var(--theme-text-dim)' }}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative inline-flex items-center shrink-0 h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: checked ? 'var(--theme-accent)' : 'var(--theme-surface)',
          border: '1px solid var(--theme-border)',
          boxShadow: checked ? '0 0 0 1px color-mix(in srgb, var(--theme-accent) 20%, transparent)' : undefined,
        }}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
          style={{
            transform: checked ? 'translateX(20px)' : 'translateX(1px)',
          }}
        />
      </button>
    </div>
  )
}
