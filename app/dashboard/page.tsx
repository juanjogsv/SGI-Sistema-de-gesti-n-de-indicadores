import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import Semaforo from '@/components/Semaforo'
import EvolucionChart from '@/components/EvolucionChart'

type CuadroMandoRow = Database['public']['Views']['v_cuadro_mando']['Row']

export default async function DashboardPage() {
  const supabase = createClient()

  // 1. Obtener el ciclo activo para poder consultar los UUIDs
  const { data: activeCiclo } = await supabase
    .from('ciclos')
    .select('id')
    .eq('activo', true)
    .single()

  const cicloId = activeCiclo?.id

  // 2. Cargar los programas activos del ciclo
  const { data: programas } = await supabase
    .from('programas')
    .select('id, nombre, eje_trabajo')
    .eq('ciclo_id', cicloId!)

  // 3. Cargar la vista de cuadro de mando
  const { data: indicadores, error: indError } = await supabase
    .from('v_cuadro_mando')
    .select('*')

  if (indError) {
    return <div className="p-8 text-red-500 font-bold">Error al cargar el cuadro de mando.</div>
  }

  // Agrupar indicadores por programa
  const programasMap = new Map<string, CuadroMandoRow[]>()
  if (indicadores) {
    for (const ind of indicadores) {
      if (!programasMap.has(ind.programa)) {
        programasMap.set(ind.programa, [])
      }
      programasMap.get(ind.programa)!.push(ind)
    }
  }

  // 4. Calcular el Score ponderado llamando a fn_score_programa
  // Tip: Promise.all para cargar en paralelo optimiza el Server Component
  const programScores = new Map()
  if (programas && cicloId) {
    await Promise.all(
      programas.map(async (prog) => {
        const { data: scoreData } = await supabase.rpc('fn_score_programa', {
          p_programa_id: prog.id,
          p_ciclo_id: cicloId,
        })
        if (scoreData && scoreData.length > 0) {
          programScores.set(prog.nombre, scoreData[0])
        }
      })
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-8 max-w-[1400px] mx-auto space-y-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard de Seguimiento</h1>
          <p className="text-gray-500 mt-2">Visor General de Indicadores (Ciclo Activo)</p>
        </header>

        {/* Gráfico Histórico */}
        <EvolucionChart />

        {programas?.map((prog) => {
          const score = programScores.get(prog.nombre)
          const inds = programasMap.get(prog.nombre) || []

          return (
            <div key={prog.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del Programa */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 bg-white">
                <div>
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                    {prog.eje_trabajo}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">{prog.nombre}</h2>
                </div>

                {score && (
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                      Score Global del Programa
                    </span>
                    <div className="flex items-center gap-4 bg-gray-50 px-5 py-3 rounded-lg border border-gray-100">
                      <span className="text-2xl font-black text-gray-800">
                        {score.score_ponderado !== null ? `${score.score_ponderado}%` : 'N/D'}
                      </span>
                      {score.score_ponderado !== null && <Semaforo nivel={score.semaforo} />}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de Indicadores */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Indicador</th>
                      <th className="px-6 py-4 font-bold w-48">Semáforo</th>
                      <th className="px-6 py-4 font-bold w-32">C. Efectivo</th>
                      <th className="px-6 py-4 font-bold w-32">C. Bruto</th>
                      <th className="px-6 py-4 font-bold w-24 text-center">Peso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inds.map((ind) => (
                      <tr key={ind.indicador_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{ind.indicador}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ind.nivel_logico}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Semaforo nivel={ind.semaforo} />
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-700">
                          {ind.c_efectivo !== null ? `${ind.c_efectivo}%` : 'N/D'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 font-medium">
                          {ind.c_pct !== null ? `${ind.c_pct}%` : 'N/D'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-400">
                          {ind.peso_estrategico || '-'}
                        </td>
                      </tr>
                    ))}
                    {inds.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          No hay indicadores activos configurados para este programa en el ciclo actual.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
