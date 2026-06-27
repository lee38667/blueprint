/**
 * Spotify Web API via the Client Credentials flow — no per-user login needed for
 * searching public playlists, which we then embed read-only. Requires free
 * SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API = 'https://api.spotify.com/v1'

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  owner: string
  image: string | null
  url: string
}

export function spotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}

// Cached app token (client-credentials). Refreshed shortly before expiry.
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) return null

  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.token
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    console.error('Spotify token error:', res.status)
    return null
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

/** Searches public playlists by query. Returns [] if unconfigured or on failure. */
export async function searchPlaylists(query: string, limit = 12): Promise<SpotifyPlaylist[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const token = await getAppToken()
  if (!token) return []

  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&type=playlist&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      playlists?: {
        items?: Array<{
          id: string
          name: string
          description?: string
          owner?: { display_name?: string }
          images?: Array<{ url: string }>
          external_urls?: { spotify?: string }
        } | null>
      }
    }

    return (json.playlists?.items ?? [])
      .filter((p): p is NonNullable<typeof p> => !!p && !!p.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        owner: p.owner?.display_name ?? 'Spotify',
        image: p.images?.[0]?.url ?? null,
        url: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
      }))
  } catch (err) {
    console.error('Spotify search error:', err)
    return []
  }
}
