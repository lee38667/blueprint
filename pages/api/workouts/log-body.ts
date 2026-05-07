import type { NextApiRequest, NextApiResponse } from 'next'
import { awardProgressFromAction, ensureGamificationProfile, requireApiUser } from '../../../lib/serverGamification'
import type { BodyPart, BodyWorkout } from '../../../types/models'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireApiUser(req, res)
  if (!auth) return

  const { supabase, user } = auth
  const { bodyPart, reps, sets, notes } = req.body as {
    bodyPart?: BodyPart
    reps?: number | null
    sets?: number | null
    notes?: string | null
  }

  if (!bodyPart) {
    return res.status(400).json({ error: 'bodyPart is required' })
  }

  try {
    const profile = await ensureGamificationProfile(user.id)
    const { data: workout, error: insertError } = await supabase
      .from('body_workouts')
      .insert({
        user_id: user.id,
        profile_id: profile.id,
        body_part: bodyPart,
        reps: reps ?? null,
        sets: sets ?? null,
        notes: notes ?? null,
      })
      .select('*')
      .single()

    if (insertError) {
      throw insertError
    }

    const reward = await awardProgressFromAction({
      userId: user.id,
      sourceType: 'body_part',
      bodyPart,
    })

    return res.status(200).json({
      workout: workout as BodyWorkout,
      profile: reward.profile,
      quest: reward.quest,
      levelUp: reward.levelUp,
      narrative: reward.narrative,
    })
  } catch (error: any) {
    console.error('log body workout error', error)
    return res.status(500).json({ error: error.message || 'Failed to log body workout' })
  }
}
