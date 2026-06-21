import { supabase } from './supabaseClient'

/**
 * fetch() wrapper that attaches the current Supabase access token as a Bearer
 * Authorization header. Use for all calls to protected /api routes.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(input, { ...init, headers })
}

export default authedFetch
