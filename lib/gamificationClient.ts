import { supabase } from './supabaseClient'

async function getAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export async function postAuthedJson<T>(url: string, body: Record<string, unknown>) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(payload.error || 'Request failed')
  }

  return response.json() as Promise<T>
}

export async function maybeCompleteQuest(body: Record<string, unknown>) {
  try {
    return await postAuthedJson<{
      narrative?: string
      quest?: { id: string }
      profile?: { level: number; exp: number; gold: number }
    }>('/api/gamification/complete-quest', body)
  } catch (error) {
    console.warn('Gamification completion skipped', error)
    return null
  }
}
