import type { NextApiRequest, NextApiResponse } from 'next'
import {
  fallbackGenerateQuests,
  getLowestBodyPart,
  sanitizeGeneratedQuest,
  type GeneratedQuestPayload,
  type QuestGenerationGoal,
  type QuestGenerationHabit,
  type QuestGenerationTask,
} from '../../../lib/gamification'
import { ensureGamificationProfile, requireApiUser } from '../../../lib/serverGamification'
import type { Quest } from '../../../types/models'

async function generateWithAI(payload: {
  tasks: QuestGenerationTask[]
  habits: QuestGenerationHabit[]
  goals: QuestGenerationGoal[]
  weakestBodyPart: string
}) {
  const apiKey = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!apiKey) return null

  const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'Blueprint/1.0',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.65,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: 'You are a gamification engine for Blueprint themed like Solo Leveling. Generate 3-5 ADHD-friendly daily quests with micro-actions, high reward energy, and JSON array output only.',
        },
        {
          role: 'user',
          content: `User data:\n${JSON.stringify(payload, null, 2)}\n\nEach quest:\n- name: Epic title (e.g., "Raid the Email Dungeon")\n- description: Fun narrative (1-2 sentences)\n- type: task/habit/workout/body_part\n- exp_reward: 10-100 based on difficulty\n- gold_reward: 5-50\n- linked_id: task/habit id or null\n- body_part: body part if type is body_part, otherwise null\n\nPrioritize ADHD-friendly micro-actions, high reward, and tie one quest to the weakest body part shown above. Output JSON array only.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    return null
  }

  const json: any = await response.json()
  const content = json.choices?.[0]?.message?.content?.trim() || ''
  const cleaned = content.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireApiUser(req, res)
  if (!auth) return

  const { supabase, user } = auth
  const { tasks = [], habits = [], goals = [], force = false } = req.body as {
    tasks?: QuestGenerationTask[]
    habits?: QuestGenerationHabit[]
    goals?: QuestGenerationGoal[]
    force?: boolean
  }

  try {
    const profile = await ensureGamificationProfile(user.id)
    const today = new Date().toISOString().slice(0, 10)

    if (!force) {
      const { data: existing } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('quest_date', today)
        .order('created_at', { ascending: true })

      const typedExisting = (existing ?? []) as Quest[]
      if (typedExisting.length >= 3) {
        return res.status(200).json({
          profile,
          quests: typedExisting,
          source: 'fallback',
        })
      }
    }

    const { data: workouts } = await supabase
      .from('body_workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(36)

    const bodyWorkouts = (workouts ?? []) as any[]
    const fallback = fallbackGenerateQuests({
      tasks,
      habits,
      goals,
      bodyWorkouts,
    })

    const weakestBodyPart = getLowestBodyPart(bodyWorkouts as any)
    const aiQuests = await generateWithAI({
      tasks,
      habits,
      goals,
      weakestBodyPart,
    })

    const generated: GeneratedQuestPayload[] = fallback.map((quest, index) => sanitizeGeneratedQuest(aiQuests?.[index] ?? {}, quest))

    await supabase
      .from('quests')
      .delete()
      .eq('user_id', user.id)
      .eq('quest_date', today)
      .eq('status', 'pending')

    const { data: inserted, error: insertError } = await supabase
      .from('quests')
      .insert(generated.slice(0, 5).map((quest) => ({
        user_id: user.id,
        name: quest.name,
        type: quest.type,
        description: quest.description,
        exp_reward: quest.exp_reward,
        gold_reward: quest.gold_reward,
        status: 'pending',
        linked_entity_id: quest.linked_id,
        body_part: quest.body_part ?? null,
        quest_date: today,
      })))
      .select('*')
      .order('created_at', { ascending: true })

    if (insertError) {
      throw insertError
    }

    return res.status(200).json({
      profile,
      quests: inserted ?? [],
      source: aiQuests ? 'ai' : 'fallback',
    })
  } catch (error: any) {
    console.error('gamification quest generation error', error)
    return res.status(500).json({ error: error.message || 'Failed to generate quests' })
  }
}
