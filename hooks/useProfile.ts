import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { UserProfile } from '../types/models'

export type ProfilePayload = Pick<
  UserProfile,
  | 'display_name'
  | 'avatar_url'
  | 'timezone'
  | 'preferred_currency'
  | 'weekly_planning_day'
  | 'life_season'
  | 'primary_roles'
  | 'core_values'
  | 'coaching_tone'
  | 'focus_statement'
  | 'default_dashboard_zones'
>

export const defaultProfilePayload: ProfilePayload = {
  display_name: '',
  avatar_url: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  preferred_currency: 'USD',
  weekly_planning_day: 'Sunday',
  life_season: '',
  primary_roles: [],
  core_values: [],
  coaching_tone: 'direct',
  focus_statement: '',
  default_dashboard_zones: ['briefing', 'metrics', 'body', 'motivation', 'ai'],
}

export function useProfile() {
  const toast = useToastStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(userError.message)
      const userId = userData.user?.id
      if (!userId) {
        setProfile(null)
        return
      }

      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (profileError) throw new Error(profileError.message)
      setProfile((data as UserProfile | null) ?? null)
    } catch (err) {
      handleError(err, { fallback: 'Failed to load profile', setError, toast })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const currentProfile = useMemo<ProfilePayload>(() => {
    if (!profile) return defaultProfilePayload
    return {
      display_name: profile.display_name ?? '',
      avatar_url: profile.avatar_url ?? '',
      timezone: profile.timezone || defaultProfilePayload.timezone,
      preferred_currency: profile.preferred_currency || 'USD',
      weekly_planning_day: profile.weekly_planning_day || 'Sunday',
      life_season: profile.life_season ?? '',
      primary_roles: profile.primary_roles ?? [],
      core_values: profile.core_values ?? [],
      coaching_tone: profile.coaching_tone || 'direct',
      focus_statement: profile.focus_statement ?? '',
      default_dashboard_zones: profile.default_dashboard_zones ?? defaultProfilePayload.default_dashboard_zones,
    }
  }, [profile])

  const saveProfile = useCallback(async (payload: ProfilePayload) => {
    try {
      setSaving(true)
      setError(null)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(userError.message)
      const userId = userData.user?.id
      if (!userId) throw new Error('You must be signed in to save a profile')

      const record = {
        user_id: userId,
        display_name: payload.display_name?.trim() || null,
        avatar_url: payload.avatar_url?.trim() || null,
        timezone: payload.timezone || 'UTC',
        preferred_currency: payload.preferred_currency || 'USD',
        weekly_planning_day: payload.weekly_planning_day || 'Sunday',
        life_season: payload.life_season?.trim() || null,
        primary_roles: payload.primary_roles,
        core_values: payload.core_values,
        coaching_tone: payload.coaching_tone,
        focus_statement: payload.focus_statement?.trim() || null,
        default_dashboard_zones: payload.default_dashboard_zones,
        updated_at: new Date().toISOString(),
      }

      const { data, error: upsertError } = await supabaseWithRetry(() =>
        supabase.from('user_profiles').upsert(record, { onConflict: 'user_id' }).select('*').single()
      )
      if (upsertError) throw new Error(upsertError.message)
      if (data) setProfile(data as unknown as UserProfile)
      toast.success('Profile saved')
    } catch (err) {
      handleError(err, { fallback: 'Failed to save profile', setError, toast })
    } finally {
      setSaving(false)
    }
  }, [toast])

  return { profile, currentProfile, loading, saving, error, loadProfile, saveProfile }
}

export default useProfile
