import { createClient } from '@/lib/supabase/server'
import ReportarClient from './ReportarClient'

export default async function ReportarPage() {
  const supabase = createClient()

  // 1. Obtener ciclo activo
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

  // 2. Cargar programas
  const { data: programas } = await supabase
    .from('programas')
    .select('id, nombre')
    .eq('ciclo_id', activeCiclo.id)

  // 3. Cargar políticas e indicadores para el frontend
  // Obtenemos solo los que ponderan en el ciclo activo
  const { data: politicas } = await supabase
    .from('politicas_calidad')
    .select(`
      indicador_id, pondera, alfa_exceso, tope_maximo, rango_min, rango_max,
      indicadores ( id, nombre, linea_base, es_inverso, programa_id )
    `)
    .eq('ciclo_id', activeCiclo.id)
    .eq('pondera', true)

  const { data: metas } = await supabase
    .from('metas')
    .select('indicador_id, valor_meta')
    .eq('ciclo_id', activeCiclo.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indicadoresDisponibles = politicas?.map((pol: any) => {
    const metaObj = metas?.find(m => m.indicador_id === pol.indicador_id)
    const ind = Array.isArray(pol.indicadores) ? pol.indicadores[0] : pol.indicadores
    return {
      id: pol.indicador_id,
      nombre: ind?.nombre,
      programa_id: ind?.programa_id,
      linea_base: ind?.linea_base,
      es_inverso: ind?.es_inverso,
      alfa_exceso: pol.alfa_exceso,
      tope_maximo: pol.tope_maximo,
      rango_min: pol.rango_min,
      rango_max: pol.rango_max,
      valor_meta: metaObj?.valor_meta || 0
    }
  }) || []

  // Pasar datos al cliente
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ingreso Individual</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Reporte de indicadores • Ciclo: {activeCiclo.nombre}</p>
      </header>
      
      <ReportarClient 
        cicloId={activeCiclo.id}
        programas={programas || []} 
        indicadores={indicadoresDisponibles} 
      />
    </div>
  )
}
