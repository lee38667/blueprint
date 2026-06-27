import type { NextApiRequest, NextApiResponse } from 'next'
import { authGuard, getServiceClient } from '../../../lib/apiAuth'
import { readDailyMetrics } from '../../../lib/serverFitness'

/** Pulls recent Google Fit metrics and upserts them into fitness_samples. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await authGuard(req, res, { name: 'fitness-sync', rateLimit: { limit: 10, windowMs: 60_000 } })
  if (!user) return

  try {
    const days = Math.min(Math.max(parseInt((req.body?.days as string) ?? '7', 10) || 7, 1), 30)
    const metrics = await readDailyMetrics(user.id, days)

    if (metrics.length === 0) {
      return res.status(404).json({ error: 'Google Fit is not connected, or no data available.' })
    }

    const rows = metrics
      // Skip wholly-empty days so we don't store noise.
      .filter((m) => m.steps != null || m.calories != null || m.resting_hr != null || m.weight_kg != null || m.sleep_min != null)
      .map((m) => ({
        user_id: user.id,
        day: m.day,
        steps: m.steps,
        calories: m.calories,
        resting_hr: m.resting_hr,
        weight_kg: m.weight_kg,
        sleep_min: m.sleep_min,
        source: 'google_fit',
        synced_at: new Date().toISOString(),
      }))

    if (rows.length > 0) {
      const { error } = await getServiceClient()
        .from('fitness_samples')
        .upsert(rows, { onConflict: 'user_id,day' })
      if (error) {
        console.error('Fitness sync upsert error:', error)
        return res.status(500).json({ error: 'Failed to store fitness data' })
      }
    }

    return res.status(200).json({ synced: rows.length, samples: rows })
  } catch (err: any) {
    console.error('Fitness sync error:', err?.message)
    return res.status(500).json({ error: 'Failed to sync Google Fit data' })
  }
}
