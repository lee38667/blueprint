import { useEffect } from 'react'
import { useStore, themes } from '../lib/store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme)
  const baseFontSize = useStore((state) => state.baseFontSize)
  const highContrastMode = useStore((state) => state.highContrastMode)

  useEffect(() => {
    const config = themes[theme]
    if (!config) return

    const root = document.documentElement
    root.style.setProperty('--theme-bg', config.bg)
    root.style.setProperty('--theme-bg-gradient-end', config.bgGradientEnd)
    root.style.setProperty('--theme-surface', config.surface)
    root.style.setProperty('--theme-surface-hover', config.surfaceHover)
    root.style.setProperty('--theme-border', config.border)
    root.style.setProperty('--theme-text', config.text)
    root.style.setProperty('--theme-text-dim', config.textDim)
    root.style.setProperty('--theme-text-muted', config.textMuted)
    root.style.setProperty('--theme-accent', config.accent)
    root.style.setProperty('--theme-accent-hover', config.accentHover)
    root.style.setProperty('--theme-accent-text', config.accentText)
    root.style.setProperty('--theme-scrollbar-track', config.scrollbarTrack)
    root.style.setProperty('--theme-scrollbar-thumb', config.scrollbarThumb)
    root.style.setProperty('--theme-scrollbar-hover', config.scrollbarHover)
    root.style.setProperty('--theme-card-bg', config.cardBg)
    root.style.setProperty('--theme-input-bg', config.inputBg)
    root.style.setProperty('--theme-sidebar-bg', config.sidebarBg)

    root.setAttribute('data-theme', theme)
    root.setAttribute('data-contrast', highContrastMode ? 'high' : 'normal')
  }, [highContrastMode, theme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${baseFontSize}px`
  }, [baseFontSize])

  return <>{children}</>
}
