'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md animate-in">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-space)' }}
          >
            <span className="text-purple">AGORA</span>
          </h1>
          <p className="text-muted text-sm">
            Piedra de Bolívar · Universidad de Cartagena
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg2 border border-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-center mb-2">
            Bienvenido
          </h2>
          <p className="text-muted text-sm text-center mb-8">
            Entra con tu cuenta de Google para continuar
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3.5 px-4 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed glow-purple"
          >
            {loading ? (
              <span className="text-sm">Conectando...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          {message && (
            <p className="mt-5 text-center text-sm text-red-400">{message}</p>
          )}

          <p className="mt-8 text-center text-xs text-muted">
            Al continuar aceptas el uso de tu cuenta de Google para autenticarte en AGORA.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Solo para estudiantes de la Universidad de Cartagena
        </p>
      </div>
    </main>
  )
}
