import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'dark' | 'electric' | 'midnight' | 'pink'

export type AccentColor = 'electric' | 'neon' | 'teal'

type FocusZoneKey = 'briefing' | 'metrics' | 'body' | 'gym' | 'motivation' | 'ai'

export interface ThemeConfig {
  name: string
  label: string
  bg: string
  bgGradientEnd: string
  surface: string
  surfaceHover: string
  border: string
  text: string
  textDim: string
  textMuted: string
  accent: string
  accentHover: string
  accentText: string
  scrollbarTrack: string
  scrollbarThumb: string
  scrollbarHover: string
  cardBg: string
  inputBg: string
  sidebarBg: string
}

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: {
    name: 'dark',
    label: 'Dark',
    bg: '#000000',
    bgGradientEnd: '#0A0A0A',
    surface: 'rgba(23, 23, 23, 0.6)',
    surfaceHover: 'rgba(38, 38, 38, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#EDEDED',
    textDim: '#A3A3A3',
    textMuted: '#737373',
    accent: '#00E5FF',
    accentHover: '#00C8E0',
    accentText: '#000000',
    scrollbarTrack: '#0a0a0a',
    scrollbarThumb: '#333333',
    scrollbarHover: '#00E5FF',
    cardBg: 'rgba(23, 23, 23, 0.6)',
    inputBg: 'rgba(0, 0, 0, 0.4)',
    sidebarBg: 'rgba(10, 10, 10, 0.8)',
  },
  electric: {
    name: 'electric',
    label: 'Electric',
    bg: '#020617',
    bgGradientEnd: '#0f172a',
    surface: 'rgba(15, 23, 42, 0.7)',
    surfaceHover: 'rgba(30, 41, 59, 0.7)',
    border: 'rgba(56, 189, 248, 0.15)',
    text: '#e2e8f0',
    textDim: '#94a3b8',
    textMuted: '#64748b',
    accent: '#38bdf8',
    accentHover: '#0ea5e9',
    accentText: '#020617',
    scrollbarTrack: '#020617',
    scrollbarThumb: '#1e293b',
    scrollbarHover: '#38bdf8',
    cardBg: 'rgba(15, 23, 42, 0.7)',
    inputBg: 'rgba(2, 6, 23, 0.5)',
    sidebarBg: 'rgba(2, 6, 23, 0.9)',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    bg: '#0c0a1a',
    bgGradientEnd: '#1a1530',
    surface: 'rgba(26, 21, 48, 0.7)',
    surfaceHover: 'rgba(42, 35, 70, 0.7)',
    border: 'rgba(139, 92, 246, 0.15)',
    text: '#e8e0f0',
    textDim: '#a78bca',
    textMuted: '#7c5caa',
    accent: '#a78bfa',
    accentHover: '#8b5cf6',
    accentText: '#0c0a1a',
    scrollbarTrack: '#0c0a1a',
    scrollbarThumb: '#2a2346',
    scrollbarHover: '#a78bfa',
    cardBg: 'rgba(26, 21, 48, 0.7)',
    inputBg: 'rgba(12, 10, 26, 0.5)',
    sidebarBg: 'rgba(12, 10, 26, 0.9)',
  },
  pink: {
    name: 'pink',
    label: 'Pink',
    bg: '#1a0a14',
    bgGradientEnd: '#2d1525',
    surface: 'rgba(45, 21, 37, 0.7)',
    surfaceHover: 'rgba(65, 30, 52, 0.7)',
    border: 'rgba(236, 72, 153, 0.15)',
    text: '#fce7f3',
    textDim: '#f9a8d4',
    textMuted: '#be185d',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentText: '#1a0a14',
    scrollbarTrack: '#1a0a14',
    scrollbarThumb: '#3b1530',
    scrollbarHover: '#ec4899',
    cardBg: 'rgba(45, 21, 37, 0.7)',
    inputBg: 'rgba(26, 10, 20, 0.5)',
    sidebarBg: 'rgba(26, 10, 20, 0.9)',
  },
}

type ThemeState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  animationsEnabled: boolean
  setAnimationsEnabled: (value: boolean) => void
  baseFontSize: number
  setBaseFontSize: (value: number) => void
  sessionTimeoutMinutes: number
  setSessionTimeoutMinutes: (value: number) => void
  highContrastMode: boolean
  setHighContrastMode: (value: boolean) => void
  focusZones: Record<FocusZoneKey, boolean>
  setFocusZone: (zone: FocusZoneKey, enabled: boolean) => void
}

const defaultFocusZones: Record<FocusZoneKey, boolean> = {
  briefing: true,
  metrics: true,
  body: true,
  gym: false,
  motivation: true,
  ai: true,
}

export const useStore = create<ThemeState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set(() => ({ mobileSidebarOpen: open })),
      theme: 'dark' as ThemeName,
      setTheme: (theme) => set(() => ({ theme })),
      accentColor: 'electric' as AccentColor,
      setAccentColor: (accent) => set(() => ({ accentColor: accent })),
      animationsEnabled: true,
      setAnimationsEnabled: (value) => set(() => ({ animationsEnabled: value })),
      baseFontSize: 16,
      setBaseFontSize: (value) => set(() => ({ baseFontSize: value })),
      sessionTimeoutMinutes: 30,
      setSessionTimeoutMinutes: (value) => set(() => ({ sessionTimeoutMinutes: value })),
      highContrastMode: false,
      setHighContrastMode: (value) => set(() => ({ highContrastMode: value })),
      focusZones: defaultFocusZones,
      setFocusZone: (zone, enabled) => set((state) => ({ focusZones: { ...state.focusZones, [zone]: enabled } })),
    }),
    {
      name: 'blueprint-settings',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        accentColor: state.accentColor,
        animationsEnabled: state.animationsEnabled,
        baseFontSize: state.baseFontSize,
        sessionTimeoutMinutes: state.sessionTimeoutMinutes,
        highContrastMode: state.highContrastMode,
        focusZones: state.focusZones,
      }),
    }
  )
)
