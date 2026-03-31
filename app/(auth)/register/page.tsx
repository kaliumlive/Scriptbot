'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/pipeline` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-50">Check your email</h2>
          <p className="text-zinc-400 text-sm mt-2">We sent you a confirmation link.</p>
          <Link href="/login" className="text-zinc-400 text-sm mt-4 block hover:text-zinc-200">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-50">Scriptbot</h1>
          <p className="text-zinc-400 text-sm mt-1">Create your account</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-600"
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-50 text-zinc-950 rounded-lg py-2 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-zinc-500 text-xs mt-6">
          Have an account?{' '}
          <Link href="/login" className="text-zinc-300 hover:text-zinc-50">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
