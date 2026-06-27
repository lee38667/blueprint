import webpush from 'web-push'
import { getServiceClient } from './apiAuth'

/**
 * Web Push (VAPID) sender. Free, vendor-less browser notifications.
 *
 * Keys are generated once with `npx web-push generate-vapid-keys` and stored in
 * env (see INTEGRATIONS_SETUP.md). The public key is also exposed to the client
 * as NEXT_PUBLIC_VAPID_PUBLIC_KEY so the browser can subscribe.
 *
 * Every query here is scoped by a verified user id — never call with an id that
 * did not come from authGuard()/requireUser().
 */

let configured = false

/** Returns true if VAPID keys are present and web-push is configured. */
export function pushConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    publicKey,
    privateKey
  )
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Sends a notification to every subscription a user has registered. Prunes
 * subscriptions the push service reports as gone (404/410). Returns the number
 * of successful deliveries.
 */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured()) return 0
  const supabase = getServiceClient()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return 0

  let sent = 0
  const stale: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        sent++
      } catch (err: any) {
        // 404/410 → subscription expired or was revoked; drop it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          stale.push(sub.id)
        } else {
          console.error('Push send error:', err?.statusCode, err?.body || err?.message)
        }
      }
    })
  )

  if (stale.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', stale)
  }

  return sent
}
