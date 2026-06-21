import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side authentication, a service-role Supabase client, and a lightweight
 * in-memory rate limiter shared by all API routes.
 *
 * Security model: every protected route must establish the calling user's
 * identity from their Supabase access token (Authorization: Bearer <token>)
 * BEFORE touching the service-role client. The service-role client bypasses
 * Row Level Security, so it must only ever be scoped by a verified user id.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

let _admin: SupabaseClient | null = null

/** Returns a memoized service-role client. Throws if credentials are missing. */
export function getServiceClient(): SupabaseClient {
  if (!supabaseUrl || !serviceKey) {
    throw new ApiError(500, 'Supabase service credentials are not configured')
  }
  if (!_admin) {
    _admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  }
  return _admin
}

export interface AuthedUser {
  id: string
  email?: string
}

/** Verifies the bearer token and returns the authenticated user, or throws ApiError. */
export async function requireUser(req: NextApiRequest): Promise<AuthedUser> {
  const header = req.headers.authorization
  const token = header && header.startsWith('Bearer ') ? header.slice(7).trim() : null
  if (!token) throw new ApiError(401, 'Authentication required')

  const { data, error } = await getServiceClient().auth.getUser(token)
  if (error || !data.user) throw new ApiError(401, 'Invalid or expired session')

  return { id: data.user.id, email: data.user.email ?? undefined }
}

// --- In-memory sliding-window rate limiter -------------------------------
// Per-process only. Adequate for single-instance / low-concurrency hosting;
// swap for a shared store (Redis/Upstash) if running multiple instances.
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  return true
}

export interface GuardOptions {
  /** Stable name used to namespace the rate-limit bucket per route. */
  name: string
  /** Optional per-user rate limit. */
  rateLimit?: { limit: number; windowMs: number }
}

/**
 * Inline auth + rate-limit guard for API handlers. Returns the user, or null
 * after having already written the appropriate error response.
 *
 *   const user = await authGuard(req, res, { name: 'chat', rateLimit: { limit: 20, windowMs: 60_000 } })
 *   if (!user) return
 */
export async function authGuard(
  req: NextApiRequest,
  res: NextApiResponse,
  opts: GuardOptions
): Promise<AuthedUser | null> {
  try {
    const user = await requireUser(req)
    if (opts.rateLimit) {
      const ok = rateLimit(`${opts.name}:${user.id}`, opts.rateLimit.limit, opts.rateLimit.windowMs)
      if (!ok) {
        res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
        return null
      }
    }
    return user
  } catch (e) {
    if (e instanceof ApiError) {
      res.status(e.status).json({ error: e.message })
    } else {
      console.error('authGuard error:', e)
      res.status(500).json({ error: 'Internal server error' })
    }
    return null
  }
}
