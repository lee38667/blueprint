import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

type FormData = { email: string; password: string }

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })
    if (error) setError(error.message)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-gray-900 rounded-lg">
        <h1 className="text-2xl mb-4">Sign in to Blueprint</h1>
        <label className="block mb-2">Email</label>
        <input {...register('email')} className="w-full p-2 rounded bg-gray-800" />
        <label className="block mt-4 mb-2">Password</label>
        <input {...register('password')} type="password" className="w-full p-2 rounded bg-gray-800" />
        {error && <p className="text-red-400 mt-2">{error}</p>}
        <button className="mt-6 w-full py-2 bg-electric text-black rounded">Sign in</button>
      </form>
    </div>
  )
}
