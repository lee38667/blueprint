import { create } from 'zustand'
import type { BodyWorkout, GamificationProfile, Quest } from '../types/models'
import type { SkillChoice } from './gamification'

export interface LevelUpState {
  previousLevel: number
  level: number
  choices: SkillChoice[]
  unlockedAreas: string[]
  narrative: string
}

interface GamificationStore {
  profile: GamificationProfile | null
  quests: Quest[]
  bodyWorkouts: BodyWorkout[]
  loading: boolean
  loaded: boolean
  actionLoading: boolean
  activeQuestId: string | null
  levelUp: LevelUpState | null
  setLoading: (loading: boolean) => void
  setActionLoading: (loading: boolean) => void
  setData: (payload: Partial<Pick<GamificationStore, 'profile' | 'quests' | 'bodyWorkouts'>>) => void
  setLoaded: (loaded: boolean) => void
  setActiveQuestId: (questId: string | null) => void
  setLevelUp: (levelUp: LevelUpState | null) => void
}

export const useGamificationStore = create<GamificationStore>()((set) => ({
  profile: null,
  quests: [],
  bodyWorkouts: [],
  loading: false,
  loaded: false,
  actionLoading: false,
  activeQuestId: null,
  levelUp: null,
  setLoading: (loading) => set(() => ({ loading })),
  setActionLoading: (actionLoading) => set(() => ({ actionLoading })),
  setData: (payload) => set((state) => ({
    profile: payload.profile ?? state.profile,
    quests: payload.quests ?? state.quests,
    bodyWorkouts: payload.bodyWorkouts ?? state.bodyWorkouts,
  })),
  setLoaded: (loaded) => set(() => ({ loaded })),
  setActiveQuestId: (activeQuestId) => set(() => ({ activeQuestId })),
  setLevelUp: (levelUp) => set(() => ({ levelUp })),
}))
