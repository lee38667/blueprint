import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'

type MfaFactor = {
  id: string
  friendly_name?: string | null
  factor_type: string
  status: string
  created_at?: string
}

type EnrollmentState = {
  factorId: string
  challengeId: string
  qrCode: string
  secret: string
  uri: string
}

export function useMfa() {
  const toast = useToastStore()
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFactors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError) throw new Error(listError.message)
      setFactors(((data?.totp ?? []) as MfaFactor[]).filter((factor) => factor.status === 'verified'))
    } catch (err) {
      handleError(err, { fallback: 'Failed to load MFA status', setError, toast })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadFactors()
  }, [loadFactors])

  const startEnrollment = useCallback(async () => {
    try {
      setWorking(true)
      setError(null)
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Blueprint Authenticator',
      })
      if (enrollError) throw new Error(enrollError.message)

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      })
      if (challengeError) throw new Error(challengeError.message)

      setEnrollment({
        factorId: data.id,
        challengeId: challengeData.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      })
    } catch (err) {
      handleError(err, { fallback: 'Failed to start MFA enrollment', setError, toast })
    } finally {
      setWorking(false)
    }
  }, [toast])

  const verifyEnrollment = useCallback(async (code: string) => {
    if (!enrollment) return
    try {
      setWorking(true)
      setError(null)
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: enrollment.challengeId,
        code,
      })
      if (verifyError) throw new Error(verifyError.message)
      setEnrollment(null)
      await loadFactors()
      toast.success('Two-factor authentication enabled')
    } catch (err) {
      handleError(err, { fallback: 'Failed to verify MFA code', setError, toast })
    } finally {
      setWorking(false)
    }
  }, [enrollment, loadFactors, toast])

  const unenrollFactor = useCallback(async (factorId: string) => {
    try {
      setWorking(true)
      setError(null)
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId })
      if (unenrollError) throw new Error(unenrollError.message)
      await loadFactors()
      toast.success('Two-factor authentication disabled')
    } catch (err) {
      handleError(err, { fallback: 'Failed to disable MFA', setError, toast })
    } finally {
      setWorking(false)
    }
  }, [loadFactors, toast])

  return {
    factors,
    enabled: factors.length > 0,
    enrollment,
    loading,
    working,
    error,
    loadFactors,
    startEnrollment,
    verifyEnrollment,
    unenrollFactor,
    cancelEnrollment: () => setEnrollment(null),
  }
}

export default useMfa
