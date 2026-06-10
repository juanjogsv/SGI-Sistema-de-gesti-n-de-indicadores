import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import UsuariosClient from './UsuariosClient'

export default async function AdminPage() {
  const supabase = createClient()

  // 1. Verificación de Autenticación y Rol
  const { data: authData } = await supabase.auth.getUser()
  
  if (!authData.user) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 font-medium">Debes iniciar sesión para ver esta página.</p>
      </div>
    )
  }

  const { data: rawData } = await supabase
    .from('usuarios')
    .select('rol_global')
    .eq('auth_user_id', authData.user.id)
    .single()

  const userData = rawData as { rol_global: string } | null

  if (userData?.rol_global !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-xl shadow-sm border border-red-100 mt-10">
        <h1 className="text-3xl font-black text-red-600 mb-4">Acceso Denegado 🛑</h1>
        <p className="text-gray-600 font-medium text-lg">
          No tienes permisos de Administrador para ver el panel de Configuración.
        </p>
      </div>
    )
  }

  // 2. Cargar datos si es Admin
  const { data: ciclos } = await supabase
    .from('ciclos')
    .select('*')
    .order('anio', { ascending: false })

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')
    .order('creado_en', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel de Configuración</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Gestión de Ciclos y Usuarios de la Plataforma (Acceso Exclusivo)</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <AdminClient initialCiclos={ciclos || []} />
        <UsuariosClient initialUsuarios={usuarios || []} />
      </div>
    </div>
  )
}
