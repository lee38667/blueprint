import { google } from 'googleapis'
import { getServiceClient } from './apiAuth'
import { encryptToken, decryptToken } from './serverCrypto'

/**
 * Google Fit access for server routes. Mirrors serverCalendar.ts: encrypted
 * tokens at rest, auto-refresh, every query scoped by a verified user id.
 *
 * Galaxy Watch 4 data reaches here via the phone-side bridge
 * Samsung Health → Health Connect → Google Fit (see INTEGRATIONS_SETUP.md).
 *
 * Scopes requested (read-only): activity (steps/calories), body (weight),
 * heart-rate, and sleep.
 */

export const FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
]

const PROVIDER = 'google_fit'
const DAY_MS = 86_400_000

export interface DailyMetric {
  day: string // YYYY-MM-DD
  steps: number | null
  calories: number | null
  resting_hr: number | null
  weight_kg: number | null
  sleep_min: number | null
}

export function fitOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_FIT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/fitness/callback`
  )
}

/** Authorized OAuth2 client for the user's Google Fit, or null if unconnected. */
export async function getFitClient(userId: string) {
  const supabase = getServiceClient()
  const { data: conn } = await supabase
    .from('fitness_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', PROVIDER)
    .single()

  if (!conn) return null

  const client = fitOAuthClient()
  client.setCredentials({
    access_token: decryptToken(conn.access_token),
    refresh_token: conn.refresh_token ? decryptToken(conn.refresh_token) : undefined,
  })

  if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
    const { credentials } = await client.refreshAccessToken()
    if (credentials.access_token) {
      await supabase
        .from('fitness_connections')
        .update({
          access_token: encryptToken(credentials.access_token),
          expires_at: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id)
    }
  }

  return client
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Runs a daily-bucketed aggregate for one data type; returns map day → point values. */
async function aggregateDaily(
  auth: any,
  dataTypeName: string,
  startMs: number,
  endMs: number,
  dataSourceId?: string
): Promise<Map<string, number[]>> {
  const fitness = google.fitness({ version: 'v1', auth })
  const aggregateBy: any = { dataTypeName }
  if (dataSourceId) aggregateBy.dataSourceId = dataSourceId

  const { data } = await fitness.users.dataset.aggregate({
    userId: 'me',
    requestBody: {
      aggregateBy: [aggregateBy],
      bucketByTime: { durationMillis: String(DAY_MS) },
      startTimeMillis: String(startMs),
      endTimeMillis: String(endMs),
    },
  })

  const out = new Map<string, number[]>()
  for (const bucket of data.bucket ?? []) {
    const day = dayKey(Number(bucket.startTimeMillis))
    const points = bucket.dataset?.[0]?.point ?? []
    const values: number[] = []
    for (const p of points) {
      for (const v of p.value ?? []) {
        const n = v.intVal ?? v.fpVal
        if (typeof n === 'number') values.push(n)
      }
    }
    if (values.length) out.set(day, values)
  }
  return out
}

/**
 * Reads the last `days` of daily metrics from Google Fit. Each metric is fetched
 * independently and failures degrade to null so one unavailable stream (e.g. no
 * weight logged) never blocks the rest.
 */
export async function readDailyMetrics(userId: string, days = 7): Promise<DailyMetric[]> {
  const auth = await getFitClient(userId)
  if (!auth) return []

  const now = Date.now()
  const endMs = Math.ceil(now / DAY_MS) * DAY_MS // next midnight UTC
  const startMs = endMs - days * DAY_MS

  const safe = async (fn: () => Promise<Map<string, number[]>>) => {
    try {
      return await fn()
    } catch (err: any) {
      console.error('Google Fit metric error:', err?.message)
      return new Map<string, number[]>()
    }
  }

  const [steps, calories, heart, weight] = await Promise.all([
    safe(() =>
      aggregateDaily(
        auth,
        'com.google.step_count.delta',
        startMs,
        endMs,
        'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
      )
    ),
    safe(() => aggregateDaily(auth, 'com.google.calories.expended', startMs, endMs)),
    safe(() => aggregateDaily(auth, 'com.google.heart_rate.bpm', startMs, endMs)),
    safe(() => aggregateDaily(auth, 'com.google.weight.summary', startMs, endMs)),
  ])

  // Sleep: sum sleep-session durations per day (sessions API, activityType 72).
  const sleepByDay = await safe(() => readSleep(auth, startMs, endMs))

  const out: DailyMetric[] = []
  for (let t = startMs; t < endMs; t += DAY_MS) {
    const day = dayKey(t)
    // heart_rate.bpm aggregate point = [average, max, min]; min ≈ resting.
    const hr = heart.get(day)
    const restingHr = hr ? Math.round(hr[hr.length - 1] ?? hr[0]) : null
    // weight.summary point = [average, max, min]; take average.
    const w = weight.get(day)
    out.push({
      day,
      steps: steps.has(day) ? Math.round(steps.get(day)!.reduce((a, b) => a + b, 0)) : null,
      calories: calories.has(day) ? Math.round(calories.get(day)!.reduce((a, b) => a + b, 0)) : null,
      resting_hr: restingHr,
      weight_kg: w ? Math.round((w[0] ?? 0) * 10) / 10 : null,
      sleep_min: sleepByDay.get(day)?.[0] ?? null,
    })
  }
  return out
}

/** Sums sleep session minutes per day from the Sessions API. */
async function readSleep(auth: any, startMs: number, endMs: number): Promise<Map<string, number[]>> {
  const fitness = google.fitness({ version: 'v1', auth })
  const { data } = await fitness.users.sessions.list({
    userId: 'me',
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
    // activityType 72 = sleep
  })

  const byDay = new Map<string, number[]>()
  for (const s of data.session ?? []) {
    if (s.activityType !== 72) continue
    const start = Number(s.startTimeMillis)
    const end = Number(s.endTimeMillis)
    if (!start || !end || end <= start) continue
    const minutes = Math.round((end - start) / 60000)
    // Attribute the sleep to its wake-up day.
    const day = dayKey(end)
    byDay.set(day, [(byDay.get(day)?.[0] ?? 0) + minutes])
  }
  return byDay
}
