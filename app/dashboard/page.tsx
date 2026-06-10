import { createClient } from '@/lib/supabase/server'
import InteractiveDashboard from '@/components/InteractiveDashboard'
import { Database } from '@/types/database'

interface ScoreData {
  programa: string
  score_ponderado: number | null
  semaforo: Database['public']['Enums']['semaforo_enum']
  n_activos: number
  n_nulos: number
  suma_pesos: number
}

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

  // 4. Calcular el Score ponderado llamando a fn_score_programa
  const programScores: ScoreData[] = []
  if (programas && cicloId) {
    await Promise.all(
      programas.map(async (prog) => {
        const { data: scoreData } = await supabase.rpc('fn_score_programa', {
          p_programa_id: prog.id,
          p_ciclo_id: cicloId,
        })
        if (scoreData && scoreData.length > 0) {
          programScores.push({
            programa: prog.nombre,
            ...scoreData[0]
          })
        }
      })
    )
  }

  return (
    <InteractiveDashboard 
      programas={programas || []} 
      indicadores={indicadores || []} 
      programScores={programScores} 
    />
  )
}
