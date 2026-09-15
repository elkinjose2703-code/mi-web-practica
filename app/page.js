'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Revisa tu correo para confirmar la cuenta')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-3 border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50"
        >
          Crear cuenta
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </main>
  )
}