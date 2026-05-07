import { ReactNode, useState } from 'react'

interface Tab {
  key: string
  label: string
  icon?: ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  onChange?: (key: string) => void
  variant?: 'default' | 'pills'
  className?: string
}

export default function Tabs({
  tabs,
  activeTab: controlledActive,
  onChange,
  variant = 'default',
  className = '',
}: TabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key)
  const activeTab = controlledActive ?? internalActive

  const handleChange = (key: string) => {
    if (onChange) {
      onChange(key)
    } else {
      setInternalActive(key)
    }
  }

  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 ${className}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => handleChange(tab.key)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            style={{
              background: activeTab === tab.key
                ? 'color-mix(in srgb, var(--theme-accent) 15%, transparent)'
                : 'transparent',
              border: activeTab === tab.key
                ? '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)'
                : '1px solid var(--theme-border)',
              color: activeTab === tab.key
                ? 'var(--theme-accent)'
                : 'var(--theme-text-muted)',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: activeTab === tab.key
                    ? 'color-mix(in srgb, var(--theme-accent) 20%, transparent)'
                    : 'var(--theme-surface)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={`flex gap-1 ${className}`}
      role="tablist"
      style={{ borderBottom: '1px solid var(--theme-border)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          onClick={() => handleChange(tab.key)}
          className="relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
          style={{
            color: activeTab === tab.key
              ? 'var(--theme-accent)'
              : 'var(--theme-text-muted)',
          }}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: activeTab === tab.key
                  ? 'color-mix(in srgb, var(--theme-accent) 15%, transparent)'
                  : 'var(--theme-surface)',
                color: activeTab === tab.key
                  ? 'var(--theme-accent)'
                  : 'var(--theme-text-muted)',
              }}
            >
              {tab.count}
            </span>
          )}
          {activeTab === tab.key && (
            <span
              className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
              style={{ background: 'var(--theme-accent)' }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
