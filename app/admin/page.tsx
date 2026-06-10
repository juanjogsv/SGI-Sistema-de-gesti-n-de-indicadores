import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = createClient()

  // Cargar ciclos
  const { data: ciclos } = await supabase
    .from('ciclos')
    .select('*')
    .order('anio', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Panel de Administración</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Gestión de Ciclos y Configuración Global</p>
      </header>

      <AdminClient initialCiclos={ciclos || []} />
    </div>
  )
}
