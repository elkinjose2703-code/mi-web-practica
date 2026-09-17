'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FeedPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }
      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileData?.nombre) {
        router.replace('/dashboard')
        return
      }
      setProfile(profileData)

      await loadPosts()
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const loadPosts = async () => {
    // 1. Cargar posts (sin join anidado)
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('id, texto, created_at, user_id')
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error cargando posts:', postsError)
      setMessage(postsError.message || 'Error al cargar publicaciones')
      return
    }

    if (!postsData || postsData.length === 0) {
      setPosts([])
      return
    }

    // 2. Obtener los user_id únicos
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))]

    // 3. Cargar perfiles de esos usuarios
    let profilesMap = {}
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nombre, carrera, semestre')
        .in('id', userIds)

      if (profilesError) {
        console.error('Error cargando profiles:', profilesError)
        // Seguimos aunque fallen los perfiles
      } else if (profilesData) {
        profilesMap = Object.fromEntries(
          profilesData.map((p) => [p.id, p])
        )
      }
    }

    // 4. Unir posts + perfil del autor
    const postsWithAuthor = postsData.map((post) => ({
      ...post,
      author: profilesMap[post.user_id] || null,
    }))

    setPosts(postsWithAuthor)
    setMessage('')
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setPublishing(true)
    setMessage('')

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        texto: newPost.trim(),
      })

    if (error) {
      console.error('Error publicando:', error)
      setMessage(error.message)
      setPublishing(false)
      return
    }

    setNewPost('')
    setPublishing(false)
    await loadPosts()
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
      {/* Header */}
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
              <Link href="/feed" className="text-foreground font-medium">
                Feed
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
        {/* Crear publicación */}
        <div className="bg-bg2 border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-purple font-semibold text-sm shrink-0">
              {profile?.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{profile?.nombre}</p>
              <p className="text-xs text-muted">{profile?.carrera} · {profile?.semestre}</p>
            </div>
          </div>

          <form onSubmit={handlePublish}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué está pasando en Piedra de Bolívar?"
              rows={3}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple transition-colors placeholder:text-muted"
            />
            <div className="flex items-center justify-between mt-3">
              {message && (
                <p className="text-sm text-red-400">{message}</p>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={publishing || !newPost.trim()}
                  className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Lista de publicaciones */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-sm">Aún no hay publicaciones.</p>
              <p className="text-muted text-xs mt-1">Sé el primero en publicar algo.</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-bg2 border border-border rounded-2xl p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center text-purple font-semibold text-sm shrink-0">
                    {post.author?.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {post.author?.nombre || 'Usuario'}
                      </span>
                      {post.author?.carrera && (
                        <span className="text-xs text-muted">
                          {post.author.carrera}
                        </span>
                      )}
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.texto}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
