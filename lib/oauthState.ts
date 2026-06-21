import crypto from 'crypto'

/**
 * Signed OAuth `state` for the Google Calendar flow.
 *
 * Previously the callback trusted the raw `state` value as the user id, letting
 * a crafted callback link a Google account to an arbitrary user. We now HMAC the
 * (userId, timestamp) pair and verify + expire it on the way back.
 */
const TTL_MS = 10 * 60 * 1000 // 10 minutes

function secret(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 16) {
    throw new Error('ENCRYPTION_KEY is required to sign OAuth state')
  }
  return key
}

export function signState(userId: string): string {
  const payload = `${userId}.${Date.now()}`
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
  return Buffer.from(`${payload}.${sig}`).toString('base64url')
}

/** Returns the verified userId, or null if the state is invalid/expired/tampered. */
export function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8')
    const lastDot = decoded.lastIndexOf('.')
    if (lastDot === -1) return null
    const payload = decoded.slice(0, lastDot)
    const sig = decoded.slice(lastDot + 1)
    const [userId, ts] = payload.split('.')
    if (!userId || !ts || !sig) return null

    const expected = crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    if (Date.now() - Number(ts) > TTL_MS) return null

    return userId
  } catch {
    return null
  }
}
