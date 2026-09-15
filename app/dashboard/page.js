"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) window.location.href = '/dashboard'
    else alert(error.message)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) alert(error.message)
  }

  return (
    <div style={{ padding: 40 }}>
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Entrar</button>
      
      <hr />
      
      <button onClick={handleGoogleLogin} style={{ background: 'white', color: 'black', border: '1px solid black', padding: 10 }}>
        Continuar con Google
      </button>
    </div>
  )
}