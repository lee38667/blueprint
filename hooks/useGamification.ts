import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'
import { postAuthedJson } from '../lib/gamificationClient'
import { useGamificationStore } from '../lib/gamificationStore'
import type { BodyPart, BodyWorkout, GamificationProfile, Quest } from '../types/models'
import type { LevelUpState } from '../lib/gamificationStore'
import type { QuestGenerationGoal, QuestGenerationHabit, QuestGenerationTask, SkillChoice } from '../lib/gamification'

interface GenerateQuestResponse {
  profile: GamificationProfile
  quests: Quest[]
  source: 'ai' | 'fallback'
}

interface CompleteQuestResponse {
  quest: Quest | null
  profile: GamificationProfile
  levelUp: LevelUpState | null
  narrative: string
}

interface LogBodyWorkoutResponse {
  workout: BodyWorkout
  profile: GamificationProfile
  quest: Quest | null
  levelUp: LevelUpState | null
  narrative: string
}

export function useGamification() {
  const toast = useToastStore()
  const profile = useGamificationStore((state) => state.profile)
  const quests = useGamificationStore((state) => state.quests)
  const bodyWorkouts = useGamificationStore((state) => state.bodyWorkouts)
  const loading = useGamificationStore((state) => state.loading)
  const loaded = useGamificationStore((state) => state.loaded)
  const actionLoading = useGamificationStore((state) => state.actionLoading)
  const activeQuestId = useGamificationStore((state) => state.activeQuestId)
  const levelUp = useGamificationStore((state) => state.levelUp)
  const setLoading = useGamificationStore((state) => state.setLoading)
  const setActionLoading = useGamificationStore((state) => state.setActionLoading)
  const setData = useGamificationStore((state) => state.setData)
  const setLoaded = useGamificationStore((state) => state.setLoaded)
  const setActiveQuestId = useGamificationStore((state) => state.setActiveQuestId)
  const setLevelUp = useGamificationStore((state) => state.setLevelUp)
  const [error, setError] = useState<string | null>(null)

  const fetchGamification = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [profileRes, questsRes, workoutsRes] = await Promise.all([
        supabase.from('user_gamification_profile').select('*').maybeSingle(),
        supabase
          .from('quests')
          .select('*')
          .eq('quest_date', today)
          .order('created_at', { ascending: true }),
        supabase
          .from('body_workouts')
          .select('*')
          .order('logged_at', { ascending: false })
          .limit(48),
      ])

      setData({
        profile: (profileRes.data ?? null) as GamificationProfile | null,
        quests: (questsRes.data ?? []) as Quest[],
        bodyWorkouts: (workoutsRes.data ?? []) as BodyWorkout[],
      })
      setLoaded(true)
    } catch (err: any) {
      setError(err.message || 'Failed to load hunter profile')
    } finally {
      setLoading(false)
    }
  }, [setData, setLoaded, setLoading])

  useEffect(() => {
    if (!loaded) {
      void fetchGamification()
    }
  }, [fetchGamification, loaded])

  const generateDailyQuests = useCallback(async (payload: {
    tasks: QuestGenerationTask[]
    habits: QuestGenerationHabit[]
    goals: QuestGenerationGoal[]
    force?: boolean
  }) => {
    setActionLoading(true)
    setError(null)
    try {
      const response = await postAuthedJson<GenerateQuestResponse>('/api/gamification/quests', payload)
      setData({ profile: response.profile, quests: response.quests })
      toast.success(response.source === 'ai' ? 'Daily quests generated' : 'Fallback quests summoned')
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to generate quests')
      toast.error(err.message || 'Failed to generate quests')
      return null
    } finally {
      setActionLoading(false)
    }
  }, [setActionLoading, setData, toast])

  const completeQuest = useCallback(async (payload: {
    questId?: string
    sourceType?: 'task' | 'habit' | 'workout' | 'body_part'
    linkedId?: string | null
    bodyPart?: BodyPart | null
  }) => {
    setActionLoading(true)
    setError(null)
    try {
      const response = await postAuthedJson<CompleteQuestResponse>('/api/gamification/complete-quest', payload)
      setData({
        profile: response.profile,
        quests: response.quest ? quests.map((quest) => quest.id === response.quest?.id ? response.quest : quest) : quests,
      })
      if (response.quest && activeQuestId === response.quest.id) {
        setActiveQuestId(null)
      }
      if (response.levelUp) {
        setLevelUp(response.levelUp)
      }
      toast.success(response.narrative)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to complete quest')
      toast.error(err.message || 'Failed to complete quest')
      return null
    } finally {
      setActionLoading(false)
    }
  }, [activeQuestId, quests, setActionLoading, setActiveQuestId, setData, setLevelUp, toast])

  const logBodyWorkout = useCallback(async (payload: {
    bodyPart: BodyPart
    reps?: number | null
    sets?: number | null
    notes?: string | null
  }) => {
    setActionLoading(true)
    setError(null)
    try {
      const response = await postAuthedJson<LogBodyWorkoutResponse>('/api/workouts/log-body', payload)
      setData({
        profile: response.profile,
        bodyWorkouts: [response.workout, ...bodyWorkouts].slice(0, 48),
        quests: response.quest ? quests.map((quest) => quest.id === response.quest?.id ? response.quest : quest) : quests,
      })
      if (response.levelUp) {
        setLevelUp(response.levelUp)
      }
      toast.success(response.narrative)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to log body workout')
      toast.error(err.message || 'Failed to log body workout')
      return null
    } finally {
      setActionLoading(false)
    }
  }, [bodyWorkouts, quests, setActionLoading, setData, setLevelUp, toast])

  const claimSkill = useCallback(async (choice: SkillChoice) => {
    try {
      const { error: insertError } = await supabase.from('skills').insert({
        name: choice.name,
        description: choice.description,
        level: 1,
        kind: 'hunter',
      })

      if (insertError) {
        throw insertError
      }

      toast.success(`${choice.name} unlocked`)
      setLevelUp(null)
      return true
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock skill')
      return false
    }
  }, [setLevelUp, toast])

  const today = new Date().toISOString().slice(0, 10)
  const todaysQuests = useMemo(() => quests.filter((quest) => quest.quest_date === today), [quests, today])

  return {
    profile,
    quests: todaysQuests,
    bodyWorkouts,
    loading,
    loaded,
    actionLoading,
    activeQuestId,
    levelUp,
    error,
    fetchGamification,
    generateDailyQuests,
    completeQuest,
    logBodyWorkout,
    claimSkill,
    acceptQuest: setActiveQuestId,
    dismissLevelUp: () => setLevelUp(null),
  }
}

export default useGamification
