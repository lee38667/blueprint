import { create } from 'zustand'

type ThemeState = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  darkMode: boolean
  toggleDarkMode: () => void
}

export const useStore = create<ThemeState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  darkMode: true,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode }))
}))
