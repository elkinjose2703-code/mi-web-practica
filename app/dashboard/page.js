'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [notas, setNotas] = useState([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function getUserAndNotes() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      setUser(user)
      await fetchNotas()
      setLoading(false)
    }

    getUserAndNotes()
  }, [router])

  const fetchNotas = async () => {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setNotas(data || [])
    }
  }

  const handleCrearNota = async (e) => {
    e.preventDefault()
    if (!nuevaNota.trim()) return

    const { error } = await supabase.from('notas').insert([
      { contenido: nuevaNota }
    ])

    if (!error) {
      setNuevaNota('')
      fetchNotas()
    } else {
      alert('Error al guardar la nota: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Cargando datos de sesión...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Mi Panel Privado</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm py-2 px-4 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        <form onSubmit={handleCrearNota} className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Escribe una nueva nota..."
            value={nuevaNota}
            onChange={(e) => setNuevaNota(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition"
          >
            Guardar
          </button>
        </form>

        <h2 className="text-lg font-semibold text-gray-700 mb-3">Mis Notas Guardadas:</h2>
        
        {notas.length === 0 ? (
          <p className="text-gray-400 text-sm italic">No tienes notas aún. Escribe una arriba y guárdala.</p>
        ) : (
          <ul className="space-y-2">
            {notas.map((nota) => (
              <li
                key={nota.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm flex justify-between items-center"
              >
                <span>{nota.contenido}</span>
                <span className="text-xs text-gray-400">
                  {new Date(nota.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}