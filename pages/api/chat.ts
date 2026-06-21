import type { NextApiRequest, NextApiResponse } from 'next'
import { AISnapshot, formatSnapshotForAI } from '../../lib/aiSnapshot'
import { authGuard } from '../../lib/apiAuth'
import { getUpcomingEvents, formatCalendarSummary } from '../../lib/serverCalendar'
import { aiText, AI_MODELS } from '../../lib/aiClient'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface CalendarAction {
  type: 'create_event'
  summary: string
  description?: string
  start: string
  end: string
  location?: string
}

interface ExtractedMemory {
  content: string
  category: string
}

type Data = {
  reply?: string
  calendarAction?: CalendarAction
  memories?: ExtractedMemory[]
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'chat', rateLimit: { limit: 30, windowMs: 60_000 } })
  if (!user) return

  const { messages, snapshot, memories } = req.body as {
    messages?: ChatMessage[]
    snapshot?: AISnapshot
    memories?: string[]
  }

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' })
  }

  const snapshotContext = snapshot ? formatSnapshotForAI(snapshot) : 'No user data available yet.'

  // Build memory context
  let memoryContext = ''
  if (memories && memories.length > 0) {
    memoryContext = `\n\nYour Memory (things you've learned about the user from past conversations):\n${memories.map(m => `- ${m}`).join('\n')}`
  }

  // Fetch Google Calendar events server-side, scoped to the authenticated user.
  let calendarSummary = ''
  try {
    const events = await getUpcomingEvents(user.id)
    calendarSummary = formatCalendarSummary(events)
  } catch (err) {
    console.error('Calendar fetch error in chat:', err)
  }

  const calendarSection = calendarSummary
    ? `\n\nGoogle Calendar:\n${calendarSummary}`
    : '\n\nGoogle Calendar: Not connected or no upcoming events.'

  const systemPrompt = `You are Blueprint AI, the living assistant embedded in the user's life-management system. You have access to their real data across all modules and should feel aware of what time it is, what is urgent now, and when a gentle nudge is better than pressure.

Here is the user's current data snapshot:
${snapshotContext}${calendarSection}${memoryContext}

Today's date is ${new Date().toISOString().slice(0, 10)} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })}) and the local time is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.

Guidelines:
- You are warm, concise, and actionable
- Reference the user's actual data when relevant (their tasks, goals, moods, finances, habits, body stats, calendar events)
- Help with planning, reflection, motivation, proactive next-step nudges, and answering questions about their life data
- When discussing schedule or planning, reference their Google Calendar events
- If asked about data you don't have, say so honestly
- Keep responses conversational but focused — avoid walls of text
- When the user asks what to do now, anchor the answer in the current time of day and their nearest commitments
- You can help analyze trends, suggest priorities, give wellness advice, and brainstorm
- Use markdown formatting when helpful (bold, lists, etc.)
- Never make up data — only reference what's in the snapshot
- Use your Memory to personalize responses — reference past preferences, names, and context the user has shared before

Calendar Scheduling:
When the user asks you to schedule, create, or add a calendar event, include a JSON block in your response using this exact format:
\`\`\`calendar_action
{"type":"create_event","summary":"Event title","start":"ISO datetime","end":"ISO datetime","description":"optional","location":"optional"}
\`\`\`
- Use ISO 8601 format for dates/times (e.g., "2026-03-17T14:00:00")
- For all-day events use date-only format (e.g., "2026-03-17") for both start and end (end = day after)
- Always confirm what you're scheduling in your text response
- If the user doesn't specify a time, ask them for it before creating the event
- If the user doesn't specify a duration, default to 1 hour

Memory Extraction:
When the user shares important personal information that would be useful to remember across conversations, include a memory block in your response. This includes: personal preferences, names of people they mention, recurring schedules, important dates, dietary/health info, work details, hobbies, goals context, or anything they explicitly ask you to remember.

Use this format (you can include multiple):
\`\`\`memory_save
{"content":"Brief factual statement about the user","category":"preference|person|schedule|health|work|hobby|general"}
\`\`\`

Do NOT announce that you're saving a memory unless the user explicitly asks you to remember something. Just naturally include the block.
Do NOT save memories for transient things (today's mood, current task status) — only save durable facts about the user.`

  try {
    const rawReply =
      (await aiText({
        model: AI_MODELS.smart,
        temperature: 0.6,
        maxTokens: 900,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20),
        ],
      })) || 'I couldn\'t generate a response. Please try again.'

    // Extract calendar action if present
    let calendarAction: CalendarAction | undefined
    let reply = rawReply

    const actionMatch = rawReply.match(/```calendar_action\s*\n?([\s\S]*?)\n?```/)
    if (actionMatch) {
      try {
        const parsed = JSON.parse(actionMatch[1].trim())
        if (parsed.type === 'create_event' && parsed.summary && parsed.start && parsed.end) {
          calendarAction = parsed
        }
      } catch {
        // Ignore parse errors
      }
      reply = reply.replace(/```calendar_action\s*\n?[\s\S]*?\n?```\s*/g, '').trim()
    }

    // Extract memories if present
    const extractedMemories: ExtractedMemory[] = []
    const memoryRegex = /```memory_save\s*\n?([\s\S]*?)\n?```/g
    let memMatch
    while ((memMatch = memoryRegex.exec(rawReply)) !== null) {
      try {
        const parsed = JSON.parse(memMatch[1].trim())
        if (parsed.content) {
          extractedMemories.push({
            content: parsed.content,
            category: parsed.category || 'general'
          })
        }
      } catch {
        // Ignore parse errors
      }
    }
    // Remove memory blocks from visible reply
    reply = reply.replace(/```memory_save\s*\n?[\s\S]*?\n?```\s*/g, '').trim()

    return res.status(200).json({
      reply,
      calendarAction,
      memories: extractedMemories.length > 0 ? extractedMemories : undefined
    })
  } catch (error) {
    console.error('Chat exception:', error)
    return res.status(500).json({ error: 'Unexpected error contacting AI service' })
  }
}

