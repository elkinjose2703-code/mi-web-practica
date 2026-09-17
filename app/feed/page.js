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
  const [openComments, setOpenComments] = useState({})
  const [commentTexts, setCommentTexts] = useState({})
  const [commentsByPost, setCommentsByPost] = useState({})
  const [liking, setLiking] = useState({})

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

      await loadPosts(user.id)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const loadPosts = async (currentUserId) => {
    const uid = currentUserId || user?.id

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

    const postIds = postsData.map((p) => p.id)
    const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))]

    let profilesMap = {}
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nombre, carrera, semestre')
        .in('id', userIds)

      if (profilesData) {
        profilesMap = Object.fromEntries(profilesData.map((p) => [p.id, p]))
      }
    }

    let likesMap = {}
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds)

    if (likesData) {
      for (const like of likesData) {
        if (!likesMap[like.post_id]) {
          likesMap[like.post_id] = { count: 0, likedByMe: false }
        }
        likesMap[like.post_id].count += 1
        if (like.user_id === uid) {
          likesMap[like.post_id].likedByMe = true
        }
      }
    }

    let commentsCountMap = {}
    const { data: commentsCountData } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds)

    if (commentsCountData) {
      for (const c of commentsCountData) {
        commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1
      }
    }

    const postsWithData = postsData.map((post) => ({
      ...post,
      author: profilesMap[post.user_id] || null,
      likesCount: likesMap[post.id]?.count || 0,
      likedByMe: likesMap[post.id]?.likedByMe || false,
      commentsCount: commentsCountMap[post.id] || 0,
    }))

    setPosts(postsWithData)
    setMessage('')
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return

    setPublishing(true)
    setMessage('')

    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, texto: newPost.trim() })

    if (error) {
      setMessage(error.message)
      setPublishing(false)
      return
    }

    setNewPost('')
    setPublishing(false)
    await loadPosts()
  }

  const toggleLike = async (postId) => {
    if (liking[postId]) return
    setLiking((prev) => ({ ...prev, [postId]: true }))

    const post = posts.find((p) => p.id === postId)
    if (!post) {
      setLiking((prev) => ({ ...prev, [postId]: false }))
      return
    }

    if (post.likedByMe) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (!error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likedByMe: false, likesCount: Math.max(0, p.likesCount - 1) }
              : p
          )
        )
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id })

      if (!error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likedByMe: true, likesCount: p.likesCount + 1 }
              : p
          )
        )
      }
    }

    setLiking((prev) => ({ ...prev, [postId]: false }))
  }

  const loadComments = async (postId) => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, texto, created_at, user_id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [] }))
      return
    }

    const userIds = [...new Set(data.map((c) => c.user_id).filter(Boolean))]
    let profilesMap = {}

    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nombre')
        .in('id', userIds)

      if (profilesData) {
        profilesMap = Object.fromEntries(profilesData.map((p) => [p.id, p]))
      }
    }

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: data.map((c) => ({
        ...c,
        authorName: profilesMap[c.user_id]?.nombre || 'Usuario',
      })),
    }))
  }

  const toggleComments = async (postId) => {
    const isOpen = openComments[postId]
    setOpenComments((prev) => ({ ...prev, [postId]: !isOpen }))
    if (!isOpen && !commentsByPost[postId]) await loadComments(postId)
  }

  const handleAddComment = async (postId) => {
    const text = (commentTexts[postId] || '').trim()
    if (!text) return

    const { error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: user.id, texto: text })

    if (error) {
      setMessage(error.message)
      return
    }

    setCommentTexts((prev) => ({ ...prev, [postId]: '' }))
    await loadComments(postId)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
      )
    )
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
      <main className="min-h-screen flex items-center justify-center theme-feed">
        <p className="text-muted-feed text-sm">Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen theme-feed">
      <header className="border-b sticky top-0 z-10" style={{ background: 'var(--feed-bg2)', borderColor: 'var(--feed-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space)' }}>
              <span className="text-purple">AGORA</span>
            </h1>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-feed hover:opacity-80 transition-opacity">Perfil</Link>
              <Link href="/feed" className="font-medium" style={{ color: 'var(--feed-text)' }}>Público</Link>
              <Link href="/hilos" className="text-muted-feed hover:opacity-80 transition-opacity">Anónimo</Link>
            </nav>
          </div>
          <button onClick={handleSignOut} className="text-sm text-muted-feed hover:opacity-80 transition-opacity">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 animate-in">
        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--feed-text)' }}>Feed</h2>
          <p className="text-xs text-muted-feed">Publicaciones públicas identificadas</p>
        </div>

        <div className="rounded-2xl p-5 mb-6 border" style={{ background: 'var(--feed-bg2)', borderColor: 'var(--feed-border)' }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-purple font-semibold text-sm shrink-0" style={{ background: 'rgba(138,92,246,0.2)' }}>
              {profile?.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--feed-text)' }}>{profile?.nombre}</p>
              <p className="text-xs text-muted-feed">{profile?.carrera} · {profile?.semestre}</p>
            </div>
          </div>

          <form onSubmit={handlePublish}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué está pasando en Piedra de Bolívar?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
              style={{ background: 'var(--feed-bg3)', border: '1px solid var(--feed-border)', color: 'var(--feed-text)' }}
            />
            <div className="flex items-center justify-between mt-3">
              {message && <p className="text-sm text-red-400">{message}</p>}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={publishing || !newPost.trim()}
                  className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {publishing ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-feed text-sm">Aún no hay publicaciones.</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl p-5 border"
                style={{ background: 'var(--feed-bg2)', borderColor: 'var(--feed-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-purple font-semibold text-sm shrink-0" style={{ background: 'rgba(138,92,246,0.2)' }}>
                    {post.author?.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'var(--feed-text)' }}>
                        {post.author?.nombre || 'Usuario'}
                      </span>
                      {post.author?.carrera && (
                        <span className="text-xs text-muted-feed">{post.author.carrera}</span>
                      )}
                      <span className="text-xs text-muted-feed">·</span>
                      <span className="text-xs text-muted-feed">{formatDate(post.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--feed-text)' }}>
                      {post.texto}
                    </p>

                    <div className="flex items-center gap-5 mt-4">
                      <button
                        onClick={() => toggleLike(post.id)}
                        disabled={liking[post.id]}
                        className={`flex items-center gap-1.5 text-sm transition-colors ${
                          post.likedByMe ? 'text-purple' : 'text-muted-feed hover:text-purple'
                        }`}
                      >
                        <span>{post.likedByMe ? '♥' : '♡'}</span>
                        <span>{post.likesCount > 0 ? post.likesCount : ''}</span>
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-sm text-muted-feed hover:opacity-80 transition-opacity"
                      >
                        <span>💬</span>
                        <span>{post.commentsCount > 0 ? post.commentsCount : 'Comentar'}</span>
                      </button>
                    </div>

                    {openComments[post.id] && (
                      <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--feed-border)' }}>
                        {(commentsByPost[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-muted-feed shrink-0" style={{ background: 'var(--feed-bg3)' }}>
                              {c.authorName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'var(--feed-bg3)' }}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium" style={{ color: 'var(--feed-text)' }}>{c.authorName}</span>
                                <span className="text-xs text-muted-feed">{formatDate(c.created_at)}</span>
                              </div>
                              <p className="text-sm mt-0.5" style={{ color: 'var(--feed-text)' }}>{c.texto}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={commentTexts[post.id] || ''}
                            onChange={(e) =>
                              setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder="Escribe un comentario..."
                            className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                            style={{ background: 'var(--feed-bg3)', border: '1px solid var(--feed-border)', color: 'var(--feed-text)' }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddComment(post.id)
                              }
                            }}
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!(commentTexts[post.id] || '').trim()}
                            className="bg-purple hover:bg-purple-dark text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
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
