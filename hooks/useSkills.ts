import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { Skill } from '../types/models'

type SkillPayload = {
  name: string
  level: number
  kind?: string | null
  description?: string | null
}

export function useSkills(){
  const toast = useToastStore()
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadSkills = async () => {
    try {
      setError(null)
      setLoading(true)
      const { data, error: loadError } = await supabase
        .from('skills')
        .select('*')
        .order('level', { ascending: false })
        .order('name', { ascending: true })
      if (loadError) throw new Error(loadError.message)
      setSkills((data as Skill[]) ?? [])
    } catch (err) {
      handleError(err, { fallback: 'Failed to load skills', setError, toast })
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    loadSkills()
  },[])

  const addSkill = async (payload: SkillPayload) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('skills').insert({
        name: payload.name.trim(),
        level: payload.level,
        kind: payload.kind?.trim() || 'general',
        description: payload.description?.trim() || null,
      }))
      await loadSkills()
      toast.success('Skill added')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add skill', setError, toast })
    }
  }

  const updateSkill = async (id: string, patch: Partial<SkillPayload>) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('skills').update({
        ...patch,
        name: patch.name?.trim(),
        kind: patch.kind?.trim() || undefined,
        description: patch.description?.trim() || null,
      }).eq('id', id))
      await loadSkills()
      toast.success('Skill updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update skill', setError, toast })
    }
  }

  const deleteSkill = async (id: string) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('skills').delete().eq('id', id))
      await loadSkills()
      toast.success('Skill deleted')
    } catch (err) {
      handleError(err, { fallback: 'Failed to delete skill', setError, toast })
    }
  }

  return { loading, skills, error, loadSkills, addSkill, updateSkill, deleteSkill }
}

export default useSkills
