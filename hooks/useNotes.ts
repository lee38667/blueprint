import { useEffect, useCallback, useState } from 'react'
import { useDataStore } from '../lib/dataStore'
import { supabase } from '../lib/supabaseClient'
import { useToastStore } from '../lib/toastStore'
import { Validators } from '../lib/validation'
import type { NoteEntry } from '../types/models'

interface NotePayload {
  title: string
  content: string
  tags?: string[]
  attachments?: Record<string, any> | null
}

interface NoteAnalysisResponse {
  summary: string
  mood: string
  sentiment: string
  keywords: string[]
  actionItems: string[]
  suggestedTags: string[]
}

export function useNotes(){
  const loading = useDataStore(s => s.notesLoading)
  const loaded = useDataStore(s => s.notesLoaded)
  const notes = useDataStore(s => s.notes)
  const fetchNotes = useDataStore(s => s.fetchNotes)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (!loaded) fetchNotes()
  },[loaded, fetchNotes])

  const addNote = useCallback(async (payload: NotePayload) => {
    try {
      setError(null)
      // Validate input
      const validation = Validators.validateNoteForm(payload.title, payload.content)
      if (!validation.isValid()) {
        const message = validation.firstError()!
        setError(message)
        toast.error(message)
        throw new Error(message)
      }
      
      const { error: supaError } = await supabase.from('notes').insert({
        title: payload.title,
        content: payload.content,
        tags: payload.tags ?? [],
        attachments: payload.attachments ?? null
      })
      
      if (supaError) {
        throw new Error(supaError.message)
      }
      
      await fetchNotes()
      toast.success('Note saved successfully')
    } catch (err: any) {
      const message = err.message || 'Failed to save note'
      setError(message)
      if (!error) toast.error(message)
    }
  }, [fetchNotes, toast])

  const updateNote = useCallback(async (id: string, patch: Partial<NotePayload>) => {
    try {
      setError(null)
      const { error: supaError } = await supabase.from('notes').update(patch).eq('id', id)
      if (supaError) throw new Error(supaError.message)
      await fetchNotes()
      toast.success('Note updated')
    } catch (err: any) {
      const message = err.message || 'Failed to update note'
      setError(message)
      toast.error(message)
    }
  }, [fetchNotes, toast])

  const deleteNote = useCallback(async (id: string) => {
    try {
      setError(null)
      const { error: supaError } = await supabase.from('notes').delete().eq('id', id)
      if (supaError) throw new Error(supaError.message)
      await fetchNotes()
      toast.success('Note deleted')
    } catch (err: any) {
      const message = err.message || 'Failed to delete note'
      setError(message)
      toast.error(message)
    }
  }, [fetchNotes, toast])

  const analyzeNote = useCallback(async (note: NoteEntry, plaintext: string) => {
    try {
      setError(null)
      const res = await fetch('/api/notes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plaintext, tags: note.tags ?? [] })
      })
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to analyze note')
      }
      
      const data = (await res.json()) as NoteAnalysisResponse
      const mergedTags = Array.from(new Set([...(note.tags ?? []), ...(data.suggestedTags ?? [])]))
      const mergedAttachments = {
        ...(note.attachments ?? {}),
        aiSummary: data.summary,
        mood: data.mood,
        sentiment: data.sentiment,
        keywords: data.keywords,
        actionItems: data.actionItems,
        analyzedAt: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase.from('notes').update({ tags: mergedTags, attachments: mergedAttachments }).eq('id', note.id)
      if (updateError) throw new Error(updateError.message)
      
      await fetchNotes()
      toast.success('Note analysis complete')
      return data
    } catch (err: any) {
      const message = err.message || 'Failed to analyze note'
      setError(message)
      toast.error(message)
      throw err
    }
  }, [fetchNotes, toast])

  return { loading, notes, error, addNote, updateNote, deleteNote, analyzeNote }
}

export default useNotes
