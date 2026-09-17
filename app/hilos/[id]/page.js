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
      <main className="min-h-screen flex items-center justify-center theme-hilos">
        <p className="text-muted-hilos text-sm">Cargando...</p>
      </main>
    )
  }

  if (!hilo) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center theme-hilos gap-4">
        <p className="text-muted-hilos text-sm">{error || 'Hilo no encontrado'}</p>
        <Link href="/hilos" className="text-purple text-sm hover:underline">
          Volver a Hilos
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen theme-hilos flex flex-col">
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

      <div className="max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col animate-in w-full">
        <div className="mb-6">
          <Link href="/hilos" className="text-xs text-muted-hilos hover:opacity-80 transition-opacity">
            ← Volver a Hilos
          </Link>
          <h2 className="text-lg font-semibold mt-2 leading-snug" style={{ color: 'var(--hilos-text)' }}>
            {hilo.titulo}
          </h2>
          <p className="text-xs text-purple mt-1">Hilo anónimo · {formatDate(hilo.created_at)}</p>
        </div>

        <div className="flex-1 space-y-3 mb-6">
          {mensajes.length === 0 ? (
            <p className="text-muted-hilos text-sm text-center py-8">No hay mensajes aún.</p>
          ) : (
            mensajes.map((msg, index) => (
              <div
                key={msg.id}
                className="rounded-2xl p-4 border"
                style={{ background: 'var(--hilos-bg2)', borderColor: 'var(--hilos-border)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-muted-hilos"
                    style={{ background: 'var(--hilos-bg3)' }}
                  >
                    ?
                  </div>
                  <span className="text-xs text-muted-hilos">Anónimo #{index + 1}</span>
                  <span className="text-xs text-muted-hilos">·</span>
                  <span className="text-xs text-muted-hilos">{formatDate(msg.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--hilos-text)' }}>
                  {msg.texto}
                </p>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleReply}
          className="rounded-2xl p-4 sticky bottom-4 border"
          style={{ background: 'var(--hilos-bg2)', borderColor: 'var(--hilos-border)' }}
        >
          <textarea
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Responder de forma anónima..."
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors"
            style={{ background: '#fff', border: '1px solid var(--hilos-border)', color: 'var(--hilos-text)' }}
          />
          <div className="flex items-center justify-between mt-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
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
