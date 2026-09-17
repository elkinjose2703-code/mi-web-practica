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
      console.error('Error cargando hilos:', error)
      setError(error.message)
      return
    }

    // Contar mensajes por hilo
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

    // Crear hilo
    const { data: hilo, error: hiloError } = await supabase
      .from('hilos')
      .insert({
        user_id: user.id,
        titulo: titulo.trim(),
      })
      .select('id')
      .single()

    if (hiloError) {
      console.error(hiloError)
      setError(hiloError.message)
      setCreating(false)
      return
    }

    // Primer mensaje del hilo
    const { error: msgError } = await supabase
      .from('hilo_mensajes')
      .insert({
        hilo_id: hilo.id,
        user_id: user.id,
        texto: mensaje.trim(),
      })

    if (msgError) {
      console.error(msgError)
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
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg2 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              <span className="text-purple">AGORA</span>
            </h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
                Perfil
              </Link>
              <Link href="/feed" className="text-muted hover:text-foreground transition-colors">
                Feed
              </Link>
              <Link href="/hilos" className="text-foreground font-medium">
                Hilos
              </Link>
            </nav>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-in">
        {/* Banner anónimo */}
        <div className="bg-bg2 border border-border rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Hilos</h2>
            <p className="text-xs text-muted mt-0.5">
              Espacio completamente anónimo. Nadie verá tu identidad.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            {showCreate ? 'Cancelar' : 'Nuevo hilo'}
          </button>
        </div>

        {/* Formulario crear hilo */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-bg2 border border-border rounded-2xl p-5 mb-6 space-y-4"
          >
            <div>
              <label className="block text-sm text-muted mb-1.5">Título del hilo</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: ¿Alguien tiene apuntes de..."
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Primer mensaje</label>
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe de forma anónima..."
                rows={3}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={creating || !titulo.trim() || !mensaje.trim()}
              className="w-full bg-purple hover:bg-purple-dark text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear hilo anónimo'}
            </button>
          </form>
        )}

        {/* Lista de hilos */}
        <div className="space-y-3">
          {hilos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-sm">Aún no hay hilos.</p>
              <p className="text-muted text-xs mt-1">Sé el primero en crear uno.</p>
            </div>
          ) : (
            hilos.map((hilo) => (
              <Link
                key={hilo.id}
                href={`/hilos/${hilo.id}`}
                className="block bg-bg2 border border-border rounded-2xl p-5 hover:border-purple/40 transition-colors"
              >
                <h3 className="text-sm font-medium leading-snug">{hilo.titulo}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span>{formatDate(hilo.created_at)}</span>
                  <span>·</span>
                  <span>{hilo.mensajesCount} {hilo.mensajesCount === 1 ? 'mensaje' : 'mensajes'}</span>
                  <span className="ml-auto text-cyan/80">Anónimo</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
