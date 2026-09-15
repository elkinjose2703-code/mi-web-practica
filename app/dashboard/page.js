'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [notas, setNotas] = useState([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }
      
      setUser(user)
      cargarNotas()
    }

    getUser()
  }, [])

  const cargarNotas = async () => {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar notas:', error.message)
    } else {
      setNotas(data || [])
    }
    setLoading(false)
  }

  const guardarNota = async (e) => {
    e.preventDefault()
    if (!nuevaNota.trim()) return

    const { error } = await supabase
      .from('notas')
      .insert([{ contenido: nuevaNota, user_id: user.id }])

    if (error) {
      console.error('Error al guardar:', error.message)
    } else {
      setNuevaNota('')
      cargarNotas()
    }
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Mis Notas</h1>
          <button
            onClick={cerrarSesion}
            className="text-sm text-red-600 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>

        <form onSubmit={guardarNota} className="mb-8 flex gap-3">
          <input
            type="text"
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            placeholder="Escribe una nueva nota..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

