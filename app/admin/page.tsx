import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import UsuariosClient from './UsuariosClient'
import ProgramasClient from './ProgramasClient'
import IndicadoresClient from './IndicadoresClient'
import MetasPoliticasClient from './MetasPoliticasClient'
import AdminTabs from './AdminTabs'
import PageHeader from '@/components/PageHeader'
import { Settings } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()

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

  const [
    { data: ciclos },
    { data: usuarios },
    { data: programas },
    { data: indicadores },
    { data: metas },
    { data: politicas },
  ] = await Promise.all([
    supabase.from('ciclos').select('*').order('anio', { ascending: false }),
    supabase.from('usuarios').select('*').order('creado_en', { ascending: true }),
    supabase.from('programas').select('*').order('nombre'),
    supabase.from('indicadores').select('*').order('nombre'),
    supabase.from('metas').select('*'),
    supabase.from('politicas_calidad').select('*'),
  ])

  const tabs = [
    {
      id: 'ciclos',
      label: 'Ciclos',
      content: <AdminClient initialCiclos={ciclos || []} />,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      content: <UsuariosClient initialUsuarios={usuarios || []} />,
    },
    {
      id: 'programas',
      label: 'Programas',
      content: (
        <ProgramasClient
          initialProgramas={programas || []}
          ciclos={ciclos || []}
        />
      ),
    },
    {
      id: 'indicadores',
      label: 'Indicadores',
      content: (
        <IndicadoresClient
          initialIndicadores={indicadores || []}
          programas={programas || []}
          ciclos={ciclos || []}
        />
      ),
    },
    {
      id: 'metas',
      label: 'Metas y Políticas',
      content: (
        <MetasPoliticasClient
          initialMetas={metas || []}
          initialPoliticas={politicas || []}
          indicadores={indicadores || []}
          programas={programas || []}
          ciclos={ciclos || []}
        />
      ),
    },
  ]

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Configuración General"
        description="Gestión centralizada de ciclos, programas, indicadores, metas y políticas de calidad."
        Icon={Settings}
        iconBgColor="bg-luker-brown"
      />
      <div className="px-4 sm:px-6">
        <AdminTabs tabs={tabs} />
      </div>
    </div>
  )
}
