"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const supabase = createClient()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Bienvenido: {user?.email}</p>
      <button onClick={async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
      }}>Cerrar sesión</button>
    </div>
  )
}