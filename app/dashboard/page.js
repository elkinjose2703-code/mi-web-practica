'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [notas, setNotas] = useState([])
  const [contenido, setContenido] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    cargarNotas()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
    }
  }

  const cargarNotas = async () => {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setNotas(data || [])
    }
    setLoading(false)
  }

  const crearNota = async (e) => {
    e.preventDefault()
    if (!contenido.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('notas').insert({
      contenido,
      user_id: user.id,
    })

    if (!error) {
      setContenido('')
      cargarNotas()
    }
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mis Notas</h1>
          <button
            onClick={cerrarSesion}
            className="text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>

        <form onSubmit={crearNota} className="mb-8 flex gap-3">
          <input
            type="text"
            placeholder="Escribe una nota..."
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="flex-1 border p-3 rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Guardar
          </button>
        </form>

        <ul className="space-y-3">
          {notas.map((nota) => (
            <li
              key={nota.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
            >
              <p className="text-gray-800">{nota.contenido}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(nota.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>

        {notas.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            Aún no tienes notas. ¡Crea la primera!
          </p>
        )}
      </div>
    </main>
  )
}