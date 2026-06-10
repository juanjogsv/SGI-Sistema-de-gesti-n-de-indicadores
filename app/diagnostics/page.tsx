import { createClient } from '@/lib/supabase/server'

export default async function DiagnosticsPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()

  let dbUserQuery = null
  let allUsersQuery = null

  if (authData.user) {
    dbUserQuery = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      
    // Intento buscar por email también por si el ID está malo
    allUsersQuery = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', authData.user.email)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Panel de Diagnóstico</h1>
      
      <h2 className="text-xl font-bold mt-4">1. Datos de Sesión (Auth)</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(authData, null, 2)}
      </pre>

      <h2 className="text-xl font-bold mt-4">2. Búsqueda de tu perfil por ID ({authData.user?.id})</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(dbUserQuery, null, 2)}
      </pre>

      <h2 className="text-xl font-bold mt-4">3. Búsqueda de tu perfil por Email ({authData.user?.email})</h2>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(allUsersQuery, null, 2)}
      </pre>
    </div>
  )
}
