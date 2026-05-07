import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useToastStore } from '../lib/toastStore'

type FormData = { email: string; password: string }

export default function RegisterPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToastStore()

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
    } else {
      toast.success('Check your email to confirm registration')
      router.push('/login')
    }
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
          className="panel-glass p-8 rounded-2xl space-y-5"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--theme-text)' }}>Create an account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>Start building your blueprint</p>
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
              {...register('password', { required: true, minLength: 6 })}
              type="password"
              autoComplete="new-password"
              className="input-base w-full"
              placeholder="Create a password (min 6 chars)"
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
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: 'var(--theme-accent)' }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
