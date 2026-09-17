'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CARRERAS = [
  'Administración de Empresas',
  'Administración Industrial',
  'Contaduría Pública',
  'Economía',
  'Ingeniería Civil',
  'Ingeniería de Alimentos',
  'Ingeniería de Sistemas',
  'Ingeniería Química',
  'Petroquímica',
]

const SEMESTRES = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', 'Egresado']

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    carrera: 'Ingeniería de Sistemas',
    semestre: '1°',
  })

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

      if (profileData) {
        setProfile(profileData)
        setForm({
          nombre: profileData.nombre || '',
          carrera: profileData.carrera || 'Ingeniería de Sistemas',
          semestre: profileData.semestre || '1°',
        })
      }

      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setMessage('El nombre es obligatorio')
      return
    }

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        nombre: form.nombre.trim(),
        carrera: form.carrera,
        semestre: form.semestre,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setProfile(data)
    setSaving(false)
    setMessage('Perfil guardado correctamente')
    setTimeout(() => setMessage(''), 2500)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Cargando...</p>
      </main>
    )
  }

  const isProfileComplete = profile && profile.nombre

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-border bg-bg2">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              <span className="text-purple">AGORA</span>
            </h1>
            {isProfileComplete && (
              <nav className="flex gap-4 text-sm">
                <Link href="/dashboard" className="text-foreground font-medium">
                  Perfil
                </Link>
                <Link href="/feed" className="text-muted hover:text-foreground transition-colors">
                  Público
                </Link>
                <Link href="/hilos" className="text-muted hover:text-foreground transition-colors">
                  Anónimo
                </Link>
              </nav>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 animate-in">
        {isProfileComplete ? (
          <div className="bg-bg2 border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-1">
              ¡Hola, {profile.nombre}!
            </h2>
            <p className="text-muted text-sm mb-6">
              {profile.carrera} · Semestre {profile.semestre}
            </p>

            <div className="bg-bg3 border border-border rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-muted mb-0.5">Correo</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Nombre</p>
                <p className="text-sm font-medium">{profile.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Carrera</p>
                <p className="text-sm font-medium">{profile.carrera}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">Semestre</p>
                <p className="text-sm font-medium">{profile.semestre}</p>
              </div>
            </div>

            <button
              onClick={() => setProfile({ ...profile, nombre: '' })}
              className="mt-6 text-sm text-purple hover:underline"
            >
              Editar perfil
            </button>

            <div className="mt-8 flex gap-3">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 bg-purple hover:bg-purple-dark text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Ir a Público
              </Link>
              <Link
                href="/hilos"
                className="inline-flex items-center gap-2 border border-border hover:border-purple/50 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Ir a Anónimo
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-bg2 border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-2">
              Completa tu perfil
            </h2>
            <p className="text-muted text-sm mb-8">
              Necesitamos algunos datos para que puedas usar AGORA.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm text-muted mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: María González"
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted mb-1.5">Carrera</label>
                <select
                  value={form.carrera}
                  onChange={(e) => setForm({ ...form, carrera: e.target.value })}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                >
                  {CARRERAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted mb-1.5">Semestre</label>
                <select
                  value={form.semestre}
                  onChange={(e) => setForm({ ...form, semestre: e.target.value })}
                  className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple transition-colors"
                >
                  {SEMESTRES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {message && (
                <p className={`text-sm ${message.includes('correctamente') ? 'text-cyan' : 'text-red-400'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple hover:bg-purple-dark text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
