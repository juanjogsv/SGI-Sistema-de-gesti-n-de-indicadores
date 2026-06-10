import { createClient } from '@/lib/supabase/server'
import CargaMasivaClient from './CargaMasivaClient'

export default async function CargaMasivaPage() {
  const supabase = createClient()

  const { data: activeCiclo } = await supabase
    .from('ciclos')
    .select('id, nombre')
    .eq('activo', true)
    .single()

  if (!activeCiclo) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500 font-medium">No hay un ciclo activo configurado en el sistema.</p>
      </div>
    )
  }

  // Traer los indicadores que aplican para validar el Excel
  const { data: politicas } = await supabase
    .from('politicas_calidad')
    .select(`
      indicador_id,
      indicadores ( id, nombre, programa_id, programas (nombre) )
    `)
    .eq('ciclo_id', activeCiclo.id)
    .eq('pondera', true)

  const indValidacion = politicas?.map((pol: { 
    indicador_id: string; 
    indicadores: { nombre: string; programa_id: string; programas: { nombre: string } } 
  }) => ({
    id: pol.indicador_id,
    nombre: pol.indicadores.nombre,
    programa_id: pol.indicadores.programa_id,
    programa_nombre: pol.indicadores.programas.nombre
  })) || []

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
       <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Carga Masiva</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Sube múltiples reportes a través de Excel • Ciclo: {activeCiclo.nombre}</p>
      </header>
      
      <CargaMasivaClient 
        cicloId={activeCiclo.id} 
        validacionData={indValidacion} 
      />
    </div>
  )
}
