import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import { authedFetch } from '../lib/apiClient'

type DataAction = {
  type: 'body_stats' | 'mood' | 'finance' | 'task' | 'note' | 'goal' | 'unknown'
  data: Record<string, any>
  confirmation: string
}

export function useAIRecorder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<DataAction | null>(null)
  const toast = useToastStore()

  const record = async (message: string): Promise<{ success: boolean; confirmation: string }> => {
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to record data')
      }

      // Call AI to parse the message
      const response = await authedFetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'record', message })
      })

      if (!response.ok) {
        throw new Error('Failed to parse message')
      }

      const { action, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      if (!action || action.type === 'unknown') {
        setError('Could not understand your message. Try being more specific.')
        return { success: false, confirmation: action?.confirmation || 'Could not parse data.' }
      }

      setLastAction(action)

      // Insert data based on type
      let insertResult
      switch (action.type) {
        case 'body_stats':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('body_stats').insert({
              user_id: user.id,
              weight_kg: action.data.weight_kg || null,
              height_cm: action.data.height_cm || null,
              body_fat_percentage: action.data.body_fat_percentage || null,
              muscle_mass_kg: action.data.muscle_mass_kg || null,
              bmi: action.data.bmi || null,
              recorded_at: action.data.date || new Date().toISOString()
            })
            return result
          })
          break

        case 'mood':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('mood_logs').insert({
              user_id: user.id,
              mood_label: action.data.mood_label,
              mood_score: action.data.mood_score,
              stress_score: action.data.stress_score || null,
              note: action.data.note || null
            })
            return result
          })
          break

        case 'finance':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('finance_logs').insert({
              user_id: user.id,
              type: action.data.type,
              amount: action.data.amount,
              category: action.data.category || null,
              note: action.data.note || null
            })
            return result
          })
          break

        case 'task':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('tasks').insert({
              user_id: user.id,
              title: action.data.title,
              priority: action.data.priority || 'medium',
              due_date: action.data.due_date || null,
              status: action.data.status || 'todo'
            })
            return result
          })
          break

        case 'note':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('notes').insert({
              user_id: user.id,
              title: action.data.title,
              content: action.data.content,
              tags: action.data.tags || null
            })
            return result
          })
          break

        case 'goal':
          insertResult = await supabaseWithRetry(async () => {
            const result = await supabase.from('goals').insert({
              user_id: user.id,
              title: action.data.title,
              category: action.data.category || null,
              target_date: action.data.target_date || null,
              description: action.data.description || null,
              status: 'active'
            })
            return result
          })
          break

        default:
          throw new Error('Unknown data type')
      }

      if ((insertResult as any)?.error) {
        throw new Error((insertResult as any).error.message)
      }

      setLoading(false)
      toast.success(action.confirmation)
      return { success: true, confirmation: action.confirmation }
    } catch (err: any) {
      const message = handleError(err, { fallback: 'Failed to record data', setError, toast })
      setLoading(false)
      return { success: false, confirmation: message }
    }
  }

  return { record, loading, error, lastAction }
}
