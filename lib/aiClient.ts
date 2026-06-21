/**
 * Centralized AI client for Blueprint.
 *
 * Goals:
 * - One endpoint: the FREE GitHub Models inference API (no paid OpenAI calls).
 * - Reliable JSON: uses `response_format` so small free models can't wrap the
 *   payload in prose/markdown, with a defensive parse + fallback as backstop.
 * - Model tiering: a "smart" model for analysis/coaching, a "fast" model for
 *   chat and quick/low-latency calls. Both overridable via env.
 * - Resilience: retries on 429 / 5xx with exponential backoff.
 *
 * Env:
 *   AI_API_KEY            (preferred) GitHub Models token
 *   GITHUB_DEVELOPER_AI_KEY (fallback key)
 *   AI_BASE_URL           override endpoint (default GitHub Models)
 *   AI_SMART_MODEL        default "gpt-4o"
 *   AI_FAST_MODEL         default "gpt-4o-mini"
 */

const ENDPOINT =
  process.env.AI_BASE_URL || 'https://models.inference.ai.azure.com/chat/completions'

export const AI_MODELS = {
  /** Analytical / coaching / planning. Stronger free model. */
  smart: process.env.AI_SMART_MODEL || 'gpt-4o',
  /** Chat, data extraction, quests — fast + cheap. */
  fast: process.env.AI_FAST_MODEL || 'gpt-4o-mini',
}

export class AIError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AIError'
    this.status = status
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CompleteOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  /** Provide either messages, or system/user shorthand. */
  messages?: ChatMessage[]
  system?: string
  user?: string
}

function getKey(): string {
  const key = process.env.AI_API_KEY || process.env.GITHUB_DEVELOPER_AI_KEY
  if (!key) throw new AIError('AI API key not configured', 500)
  return key
}

function buildMessages(opts: CompleteOptions): ChatMessage[] {
  if (opts.messages) return opts.messages
  const msgs: ChatMessage[] = []
  if (opts.system) msgs.push({ role: 'system', content: opts.system })
  if (opts.user) msgs.push({ role: 'user', content: opts.user })
  return msgs
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function callModel(
  opts: CompleteOptions,
  responseFormat?: Record<string, unknown>
): Promise<string> {
  const key = getKey()
  const body = {
    model: opts.model || AI_MODELS.fast,
    messages: buildMessages(opts),
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 800,
    ...(responseFormat ? { response_format: responseFormat } : {}),
  }

  const maxRetries = 2
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${key}`,
          'User-Agent': 'Blueprint/1.0',
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const json: any = await res.json()
        return json.choices?.[0]?.message?.content?.trim() ?? ''
      }

      // Retry on rate-limit / transient server errors; fail fast otherwise.
      if (res.status === 429 || res.status >= 500) {
        lastErr = new AIError(`AI provider returned ${res.status}`, res.status)
        if (attempt < maxRetries) {
          await sleep(800 * Math.pow(2, attempt))
          continue
        }
      }
      const text = await res.text().catch(() => '')
      throw new AIError(`AI request failed (${res.status}): ${text.slice(0, 200)}`, res.status)
    } catch (err) {
      lastErr = err
      if (err instanceof AIError && err.status && err.status < 500 && err.status !== 429) {
        throw err // non-retryable
      }
      if (attempt < maxRetries) {
        await sleep(800 * Math.pow(2, attempt))
        continue
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new AIError('AI request failed')
}

/** Free-text completion (chat, short insights). */
export async function aiText(opts: CompleteOptions): Promise<string> {
  return callModel(opts)
}

/** Strip code fences / surrounding prose and parse the first JSON value found. */
function parseJSONLoose<T>(raw: string): T | null {
  if (!raw) return null
  let s = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(s) as T
  } catch {
    // Fall back to the outermost {...} or [...] span.
    const objStart = s.indexOf('{')
    const objEnd = s.lastIndexOf('}')
    const arrStart = s.indexOf('[')
    const arrEnd = s.lastIndexOf(']')
    const start = arrStart !== -1 && (objStart === -1 || arrStart < objStart) ? arrStart : objStart
    const end = start === arrStart ? arrEnd : objEnd
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1)) as T
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * JSON completion. Forces `response_format: json_object` so the model returns a
 * valid object (no prose/fences). Falls back to a plain call if the model
 * rejects the format, then to `fallback` if parsing still fails.
 *
 * NOTE: json_object mode requires the word "json" somewhere in the prompt — all
 * callers describe their JSON shape, which satisfies this.
 */
export async function aiJSON<T>(opts: CompleteOptions & { fallback: T }): Promise<T> {
  const { fallback, ...rest } = opts
  const callOpts: CompleteOptions = {
    model: rest.model || AI_MODELS.smart,
    temperature: rest.temperature ?? 0.3,
    maxTokens: rest.maxTokens ?? 700,
    ...rest,
  }

  let text = ''
  try {
    text = await callModel(callOpts, { type: 'json_object' })
  } catch (err) {
    // Some models/deployments reject response_format — retry once plain.
    try {
      text = await callModel(callOpts)
    } catch {
      return fallback
    }
  }

  return parseJSONLoose<T>(text) ?? fallback
}
