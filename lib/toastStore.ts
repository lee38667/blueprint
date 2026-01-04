import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type, duration = 3000) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }))
    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
  },

  success: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), message, type: 'success' }]
    }))
  },

  error: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), message, type: 'error' }]
    }))
  },

  info: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), message, type: 'info' }]
    }))
  },

  warning: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), message, type: 'warning' }]
    }))
  }
}))
