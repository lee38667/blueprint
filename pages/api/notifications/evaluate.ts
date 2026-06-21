import type { NextApiRequest, NextApiResponse } from 'next'
import { evaluateRules } from '../../../lib/notificationRules'
import type { AISnapshot } from '../../../lib/aiSnapshot'
import { authGuard } from '../../../lib/apiAuth'

type Data = {
  notifications: Array<{ title: string; message: string; dedupKey: string }>
} | { error: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'notifications-evaluate' })
  if (!user) return

  const { snapshot, habits } = req.body as {
    snapshot?: AISnapshot
    habits?: { habits: any[]; logs: any[] }
  }

  if (!snapshot) {
    return res.status(400).json({ error: 'Snapshot payload required' })
  }

  const notifications = evaluateRules(snapshot, habits ?? undefined)
  return res.status(200).json({ notifications })
}
