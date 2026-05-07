import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import {
  applyProgress,
  getPassiveRewards,
  getSkillChoices,
  getUnlockedAreasForLevel,
} from './gamification'
import type { BodyPart, GamificationProfile, Quest, QuestType } from '../types/models'
import type { LevelUpState } from './gamificationStore'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export async function requireApiUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ error: 'Not authenticated' })
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getServiceSupabase()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' })
      return null
    }

    return { supabase, user }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to authenticate user' })
    return null
  }
}

export async function ensureGamificationProfile(userId: string) {
  const supabase = getServiceSupabase()
  const { data: existing, error: existingError } = await supabase
    .from('user_gamification_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return existing as GamificationProfile
  }

  const payload = {
    user_id: userId,
    level: 1,
    exp: 0,
    gold: 0,
    class: 'Warrior',
    unlocked_areas: getUnlockedAreasForLevel(1),
  }

  const { data, error } = await supabase
    .from('user_gamification_profile')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as GamificationProfile
}

export async function findPendingQuest(params: {
  userId: string
  questId?: string
  sourceType?: QuestType
  linkedId?: string | null
  bodyPart?: BodyPart | null
}) {
  const supabase = getServiceSupabase()
  const today = new Date().toISOString().slice(0, 10)

  if (params.questId) {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('id', params.questId)
      .eq('user_id', params.userId)
      .maybeSingle()

    if (error) throw error
    return (data ?? null) as Quest | null
  }

  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', params.userId)
    .eq('quest_date', today)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error

  const quests = (data ?? []) as Quest[]
  return quests.find((quest) => {
    if (params.sourceType === 'body_part') {
      return quest.type === 'body_part' && quest.body_part === (params.bodyPart ?? null)
    }

    return quest.type === params.sourceType && quest.linked_entity_id === (params.linkedId ?? null)
  }) ?? null
}

export async function awardProgressFromAction(params: {
  userId: string
  questId?: string
  sourceType: QuestType
  linkedId?: string | null
  bodyPart?: BodyPart | null
}) {
  const supabase = getServiceSupabase()
  const profile = await ensureGamificationProfile(params.userId)
  const pendingQuest = await findPendingQuest(params)

  const gainedExp = pendingQuest?.exp_reward ?? getPassiveRewards(params.sourceType).exp
  const gainedGold = pendingQuest?.gold_reward ?? getPassiveRewards(params.sourceType).gold
  const progression = applyProgress(profile.level, profile.exp, gainedExp)
  const updatedProfilePayload = {
    exp: progression.exp,
    level: progression.level,
    gold: profile.gold + gainedGold,
    unlocked_areas: progression.unlockedAreas,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedProfile, error: profileError } = await supabase
    .from('user_gamification_profile')
    .update(updatedProfilePayload)
    .eq('id', profile.id)
    .select('*')
    .single()

  if (profileError) {
    throw profileError
  }

  let completedQuest: Quest | null = null
  if (pendingQuest) {
    const { data: updatedQuest, error: questError } = await supabase
      .from('quests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingQuest.id)
      .select('*')
      .single()

    if (questError) {
      throw questError
    }

    completedQuest = updatedQuest as Quest
  }

  const levelUp: LevelUpState | null = progression.leveledUp
    ? {
        previousLevel: profile.level,
        level: progression.level,
        choices: getSkillChoices(progression.level, params.bodyPart ?? completedQuest?.body_part ?? null),
        unlockedAreas: progression.unlockedAreas,
        narrative: `The gate cracks open. You rose from level ${profile.level} to level ${progression.level}.`,
      }
    : null

  const narrative = completedQuest
    ? `You slayed the ${completedQuest.name}. +${completedQuest.exp_reward} EXP, +${completedQuest.gold_reward} gold.`
    : `Hunter progress logged. +${gainedExp} EXP, +${gainedGold} gold.`

  return {
    profile: updatedProfile as GamificationProfile,
    quest: completedQuest,
    levelUp,
    narrative,
  }
}
