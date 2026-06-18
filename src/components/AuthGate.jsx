import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthGate() {
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    if (mode === 'signup' && password.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      })
      if (error) setMsg({ type: 'error', text: error.message })
      else setMsg({ type: 'ok', text: 'Check your email to confirm your account.' })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg({ type: 'error', text: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight">
      <div className="w-full max-w-sm px-6 py-8 panel-card shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-fantasy text-3xl text-gold tracking-widest">TROUBADOUR</h1>
          <p className="text-xs text-gray-500 mt-1 tracking-wider uppercase">TTRPG Audio Manager</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Display Name</label>
              <input
                className="input-dark w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dungeon Master"
                required
              />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
            <input
              className="input-dark w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dm@example.com"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Password</label>
            <input
              className="input-dark w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {msg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msg.type === 'error' ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full mt-2 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Enter the Tavern' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
            className="text-gold hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
