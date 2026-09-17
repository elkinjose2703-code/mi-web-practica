'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HilosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [hilos, setHilos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }
      setUser(user)
      await loadHilos()
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const loadHilos = async () => {
    const { data, error } = await supabase
      .from('hilos')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    const hiloIds = (data || []).map((h) => h.id)
    let counts = {}

    if (hiloIds.length > 0) {
      const { data: msgs } = await supabase
        .from('hilo_mensajes')
        .select('hilo_id')
        .in('hilo_id', hiloIds)

      if (msgs) {
        for (const m of msgs) {
          counts[m.hilo_id] = (counts[m.hilo_id] || 0) + 1
        }
      }
    }

    setHilos(
      (data || []).map((h) => ({
        ...h,
        mensajesCount: counts[h.id] || 0,
      }))
    )
    setError('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !mensaje.trim()) return

    setCreating(true)
    setError('')

    const { data: hilo, error: hiloError } = await supabase
      .from('hilos')
      .insert({ user_id: user.id, titulo: titulo.trim() })
      .select('id')
      .single()

    if (hiloError) {
      setError(hiloError.message)
      setCreating(false)
      return
    }

    const { error: msgError } = await supabase
      .from('hilo_mensajes')
      .insert({
        hilo_id: hilo.id,
        user_id: user.id,
        texto: mensaje.trim(),
      })

    if (msgError) {
      setError(msgError.message)
      setCreating(false)
      return
    }

    setTitulo('')
    setMensaje('')
    setShowCreate(false)
    setCreating(false)
    router.push(`/hilos/${hilo.id}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMin < 1) return 'ahora'
    if (diffMin < 60) return `hace ${diffMin} min`
    if (diffHours < 24) return `hace ${diffHours} h`
    if (diffDays < 7) return `hace ${diffDays} d`
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center theme-hilos">
        <p className="text-muted-hilos text-sm">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen theme-hilos">
      <header className="border-b sticky top-0 z-10" style={{ background: '#fff', borderColor: 'var(--hilos-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space)' }}>
              <span className="text-purple">AGORA</span>
            </h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-hilos hover:opacity-80 transition-opacity">Perfil</Link>
              <Link href="/feed" className="text-muted-hilos hover:opacity-80 transition-opacity">Público</Link>
              <Link href="/hilos" className="font-medium" style={{ color: 'var(--hilos-text)' }}>Anónimo</Link>
            </nav>
          </div>
          <button onClick={handleSignOut} className="text-sm text-muted-hilos hover:opacity-80 transition-opacity">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-in">
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4 border"
          style={{ background: 'var(--hilos-bg2)', borderColor: 'var(--hilos-border)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--hilos-text)' }}>Hilos</h2>
            <p className="text-xs text-muted-hilos mt-0.5">
              Espacio completamente anónimo. Nadie verá tu identidad.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            {showCreate ? 'Cancelar' : 'Crear hilo'}
          </button>
        </div>

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="rounded-2xl p-5 mb-6 space-y-4 border"
            style={{ background: 'var(--hilos-bg2)', borderColor: 'var(--hilos-border)' }}
          >
            <div>
              <label className="block text-sm text-muted-hilos mb-1.5">Título del hilo</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: ¿Alguien tiene apuntes de..."
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                style={{ background: '#fff', border: '1px solid var(--hilos-border)', color: 'var(--hilos-text)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted-hilos mb-1.5">Primer mensaje</label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe de forma anónima..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors"
                style={{ background: '#fff', border: '1px solid var(--hilos-border)', color: 'var(--hilos-text)' }}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={creating || !titulo.trim() || !mensaje.trim()}
              className="w-full bg-purple hover:bg-purple-dark text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear hilo'}
            </button>
          </form>
        )}

        <div className="space-y-3">
          {hilos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-hilos text-sm">Aún no hay hilos.</p>
              <p className="text-muted-hilos text-xs mt-1">Sé el primero en crear uno.</p>
            </div>
          ) : (
            hilos.map((hilo) => (
              <Link
                key={hilo.id}
                href={`/hilos/${hilo.id}`}
                className="block rounded-2xl p-5 border transition-colors hover:border-purple/40"
                style={{ background: 'var(--hilos-bg2)', borderColor: 'var(--hilos-border)' }}
              >
                <h3 className="text-sm font-medium leading-snug" style={{ color: 'var(--hilos-text)' }}>
                  {hilo.titulo}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-hilos">
                  <span>{formatDate(hilo.created_at)}</span>
                  <span>·</span>
                  <span>{hilo.mensajesCount} {hilo.mensajesCount === 1 ? 'mensaje' : 'mensajes'}</span>
                  <span className="ml-auto text-purple">Anónimo</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
