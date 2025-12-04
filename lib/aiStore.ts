import { create } from 'zustand'
import type { BrainInsight } from './aiSnapshot'

interface AIStoreState {
  currentHash: string | null
  insight: BrainInsight | null
  loading: boolean
  error: string | null
  setLoading: (hash: string) => void
  setResult: (hash: string, insight: BrainInsight) => void
  setError: (message: string) => void
  reset: () => void
}

export const useAIStore = create<AIStoreState>((set) => ({
  currentHash: null,
  insight: null,
  loading: false,
  error: null,
  setLoading: (hash) => set({ currentHash: hash, loading: true, error: null }),
  setResult: (hash, insight) =>
    set({ currentHash: hash, insight, loading: false, error: null }),
  setError: (message) => set((state) => ({
    loading: false,
    error: message,
    insight: state.insight,
    currentHash: state.currentHash
  })),
  reset: () => set({ currentHash: null, insight: null, loading: false, error: null })
}))
