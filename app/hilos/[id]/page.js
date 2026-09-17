'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function HiloDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const hiloId = params.id

  const [user, setUser] = useState(null)
  const [hilo, setHilo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }
      setUser(user)

      // Cargar hilo
      const { data: hiloData, error: hiloError } = await supabase
        .from('hilos')
        .select('id, titulo, created_at')
        .eq('id', hiloId)
        .single()

      if (hiloError || !hiloData) {
        setError('Hilo no encontrado')
        setLoading(false)
        return
      }
      setHilo(hiloData)

      await loadMensajes()
      setLoading(false)
    }
    load()
  }, [hiloId, router, supabase])

  const loadMensajes = async () => {
    const { data, error } = await supabase
      .from('hilo_mensajes')
      .select('id, texto, created_at')
      .eq('hilo_id', hiloId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error cargando mensajes:', error)
      setError(error.message)
      return
    }

    setMensajes(data || [])
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    setSending(true)
    setError('')

    const { error: insertError } = await supabase
      .from('hilo_mensajes')
      .insert({
        hilo_id: hiloId,
        user_id: user.id,
        texto: nuevoMensaje.trim(),
      })

    if (insertError) {
      console.error(insertError)
      setError(insertError.message)
      setSending(false)
      return
    }

    setNuevoMensaje('')
    setSending(false)
    await loadMensajes()
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

  if (!hilo) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4">
        <p className="text-muted text-sm">{error || 'Hilo no encontrado'}</p>
        <Link href="/hilos" className="text-purple text-sm hover:underline">
          Volver a Hilos
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col">
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

      <div className="max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col animate-in w-full">
        {/* Volver + título */}
        <div className="mb-6">
          <Link
            href="/hilos"
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            ← Volver a Hilos
          </Link>
          <h2 className="text-lg font-semibold mt-2 leading-snug">{hilo.titulo}</h2>
          <p className="text-xs text-cyan/80 mt-1">Hilo anónimo · {formatDate(hilo.created_at)}</p>
        </div>

        {/* Mensajes */}
        <div className="flex-1 space-y-3 mb-6">
          {mensajes.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">No hay mensajes aún.</p>
          ) : (
            mensajes.map((msg, index) => (
              <div
                key={msg.id}
                className="bg-bg2 border border-border rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-bg3 flex items-center justify-center text-xs text-muted">
                    ?
                  </div>
                  <span className="text-xs text-muted">Anónimo #{index + 1}</span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
              </div>
            ))
          )}
        </div>

        {/* Responder */}
        <form
          onSubmit={handleReply}
          className="bg-bg2 border border-border rounded-2xl p-4 sticky bottom-4"
        >
          <textarea
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Responder de forma anónima..."
            rows={2}
            className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-muted"
          />
          <div className="flex items-center justify-between mt-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={sending || !nuevoMensaje.trim()}
                className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
