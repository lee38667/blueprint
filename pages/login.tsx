import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

type FormData = { email: string; password: string }

type PendingMfa = {
  factorId: string
  challengeId: string
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()
  const [error, setError] = useState<string | null>(null)
  const [pendingMfa, setPendingMfa] = useState<PendingMfa | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSubmitting, setMfaSubmitting] = useState(false)
  const router = useRouter()

  const onSubmit = async (data: FormData) => {
    setError(null)
    setPendingMfa(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      return
    }

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError) {
      setError(aalError.message)
      return
    }

    if (aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) {
        setError(factorsError.message)
        return
      }
      const factor = factorsData.totp.find((item) => item.status === 'verified')
      if (!factor) {
        setError('No verified authenticator factor is available for this account.')
        return
      }
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id })
      if (challengeError) {
        setError(challengeError.message)
        return
      }
      setPendingMfa({ factorId: factor.id, challengeId: challengeData.id })
      return
    }

    router.push('/dashboard')
  }

  const verifyMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingMfa || mfaCode.length < 6) return
    setMfaSubmitting(true)
    setError(null)
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingMfa.factorId,
      challengeId: pendingMfa.challengeId,
      code: mfaCode,
    })
    setMfaSubmitting(false)
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--theme-bg)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
              <Image src="/logo.png" alt="Blueprint" fill className="object-contain" priority />
            </div>
            <span className="text-2xl font-display font-bold tracking-wide" style={{ color: 'var(--theme-text)' }}>
              Blueprint
            </span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`panel-glass p-8 rounded-2xl space-y-5 ${pendingMfa ? 'hidden' : ''}`}
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Sign in to your account</p>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              autoComplete="email"
              className="input-base w-full"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Password</label>
            <input
              {...register('password', { required: true })}
              type="password"
              autoComplete="current-password"
              className="input-base w-full"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-accent w-full py-3 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium" style={{ color: 'var(--theme-accent)' }}>
              Create one
            </Link>
          </p>
        </form>

        {pendingMfa && (
          <form onSubmit={verifyMfa} className="panel-glass p-8 rounded-2xl space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>Verify sign in</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Enter the 6-digit code from your authenticator app.</p>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-muted)' }}>Authenticator Code</label>
              <input
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="input-base w-full"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={mfaSubmitting || mfaCode.length < 6}
              className="btn-accent w-full py-3 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {mfaSubmitting ? 'Verifying...' : 'Verify code'}
            </button>

            <button
              type="button"
              onClick={() => { setPendingMfa(null); setMfaCode(''); supabase.auth.signOut() }}
              className="w-full py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-dim)' }}
            >
              Cancel sign in
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
