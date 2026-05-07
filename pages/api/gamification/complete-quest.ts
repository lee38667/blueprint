import type { NextApiRequest, NextApiResponse } from 'next'
import { awardProgressFromAction, requireApiUser } from '../../../lib/serverGamification'
import type { BodyPart, QuestType } from '../../../types/models'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireApiUser(req, res)
  if (!auth) return

  const { user } = auth
  const { questId, sourceType, linkedId, bodyPart } = req.body as {
    questId?: string
    sourceType?: QuestType
    linkedId?: string | null
    bodyPart?: BodyPart | null
  }

  if (!questId && !sourceType) {
    return res.status(400).json({ error: 'questId or sourceType is required' })
  }

  try {
    const result = await awardProgressFromAction({
      userId: user.id,
      questId,
      sourceType: sourceType ?? 'task',
      linkedId: linkedId ?? null,
      bodyPart: bodyPart ?? null,
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('complete quest error', error)
    return res.status(500).json({ error: error.message || 'Failed to complete quest' })
  }
}
