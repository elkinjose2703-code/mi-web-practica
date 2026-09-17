'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/')
        return
      }
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg">
      {/* Header simple */}
      <header className="border-b border-border bg-bg2">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-space)' }}
          >
            <span className="text-purple">AGORA</span>
          </h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 animate-in">
        <div className="bg-bg2 border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-semibold mb-2">
            ¡Hola!
          </h2>
          <p className="text-muted mb-6">
            Has iniciado sesión correctamente.
          </p>

          <div className="bg-bg3 border border-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">Correo</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>

          <p className="mt-8 text-sm text-muted">
            Próximamente: Feed e Hilos.
          </p>
        </div>
      </div>
    </main>
  )
}
