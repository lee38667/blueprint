import { useEffect, useCallback } from 'react'
import { useDataStore } from '../lib/dataStore'
import { supabase } from '../lib/supabaseClient'
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

  useEffect(()=>{
    if (!loaded) fetchNotes()
  },[loaded, fetchNotes])

  const addNote = useCallback(async (payload: NotePayload) => {
    await supabase.from('notes').insert({
      title: payload.title,
      content: payload.content,
      tags: payload.tags ?? [],
      attachments: payload.attachments ?? null
    })
    await fetchNotes()
  }, [fetchNotes])

  const updateNote = useCallback(async (id: string, patch: Partial<NotePayload>) => {
    await supabase.from('notes').update(patch).eq('id', id)
    await fetchNotes()
  }, [fetchNotes])

  const deleteNote = useCallback(async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    await fetchNotes()
  }, [fetchNotes])

  const analyzeNote = useCallback(async (note: NoteEntry, plaintext: string) => {
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
    await supabase.from('notes').update({ tags: mergedTags, attachments: mergedAttachments }).eq('id', note.id)
    await fetchNotes()
    return data
  }, [fetchNotes])

  return { loading, notes, addNote, updateNote, deleteNote, analyzeNote }
}

export default useNotes
