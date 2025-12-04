import { create } from 'zustand'

type ThemeState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  accentColor: 'electric' | 'neon' | 'teal'
  setAccentColor: (color: 'electric' | 'neon' | 'teal') => void
  animationsEnabled: boolean
  setAnimationsEnabled: (value: boolean) => void
  baseFontSize: number
  setBaseFontSize: (value: number) => void
  twoFactorEnabled: boolean
  setTwoFactorEnabled: (value: boolean) => void
  sessionTimeoutMinutes: number
  setSessionTimeoutMinutes: (value: number) => void
}

export const useStore = create<ThemeState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  darkMode: true,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  accentColor: 'electric',
  setAccentColor: (accent) => set(() => ({ accentColor: accent })),
  animationsEnabled: true,
  setAnimationsEnabled: (value) => set(() => ({ animationsEnabled: value })),
  baseFontSize: 16,
  setBaseFontSize: (value) => set(() => ({ baseFontSize: value })),
  twoFactorEnabled: false,
  setTwoFactorEnabled: (value) => set(() => ({ twoFactorEnabled: value })),
  sessionTimeoutMinutes: 30,
  setSessionTimeoutMinutes: (value) => set(() => ({ sessionTimeoutMinutes: value }))
}))
