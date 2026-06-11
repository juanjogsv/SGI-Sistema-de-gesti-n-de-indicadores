import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import { LayoutDashboard } from 'lucide-react'
import ProgramCard from '@/components/ProgramCard'
import { Database } from '@/types/database'

type ScoreData = {
  programa: string
  score_ponderado: number | null
  semaforo: Database['public']['Enums']['semaforo_enum']
  n_activos: number
  n_nulos: number
  suma_pesos: number
}

export default async function DashboardPage() {
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

  // 2. Cargar programas del ciclo activo
  const { data: programas } = await supabase
    .from('programas')
    .select('id, nombre, eje_trabajo')
    .eq('ciclo_id', activeCiclo.id)

  // 3. Cargar cuadro de mando (indicadores del ciclo activo)
  const { data: indicadores } = await supabase
    .from('v_cuadro_mando')
    .select('*')

  const indList = indicadores || []
  const progs = programas || []

  // 4. Calcular scores ponderados por programa llamando a RPC
  const programScores: ScoreData[] = []
  if (progs.length > 0) {
    await Promise.all(
      progs.map(async (prog) => {
        const { data: scoreData } = await supabase.rpc('fn_score_programa', {
          p_programa_id: prog.id,
          p_ciclo_id: activeCiclo.id,
        })
        if (scoreData && scoreData.length > 0) {
          programScores.push({ programa: prog.nombre, ...scoreData[0] })
        }
      })
    )
  }

  // --- Métrica 1: Total Programas Activos
  const totalProg = progs.length

  // --- Métrica 2: Total Indicadores Activos
  const totalInd = indList.length

  // --- Métrica 3: Score Promedio Ponderado Global
  let sumScore = 0
  let countScore = 0
  programScores.forEach(s => {
    if (s.score_ponderado !== null) {
      sumScore += s.score_ponderado
      countScore++
    }
  })
  const avgScore = countScore > 0 ? (sumScore / countScore).toFixed(1) : '—'

  // --- Métrica 4: Cantidad de indicadores en rojo/rojo_crítico
  const indsRojos = indList.filter(i => 
    i.valor_real !== null && (i.semaforo === 'rojo' || i.semaforo === 'rojo_critico')
  ).length

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Panel Principal" 
        description={`Bienvenido al Sistema de Gestión de Indicadores. Ciclo activo: ${activeCiclo.nombre}`}
        Icon={LayoutDashboard}
        iconBgColor="bg-luker-teal"
      />

      <section className="relative overflow-hidden mb-12 -mx-4 sm:-mx-6 lg:-mx-8 px-6 lg:px-8 py-12 rounded-2xl shadow-sm border border-border bg-card/50">
        <div className="absolute inset-0 bg-gradient-to-br from-luker-green/5 via-luker-orange/5 to-luker-teal/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-luker-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-luker-orange/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="text-sm font-semibold text-white bg-gradient-to-r from-luker-green to-luker-teal px-5 py-2.5 rounded-full shadow-md inline-block uppercase tracking-wider">
            PLATAFORMA DE GESTIÓN ESTRATÉGICA
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-luker-brown leading-tight tracking-tight mt-6">
            Transformando vidas a través de la{' '}
            <span className="bg-gradient-to-r from-luker-green to-luker-teal bg-clip-text text-transparent">educación</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto mt-6">
            <strong className="text-luker-brown font-bold">Movilizamos palancas para que niños y jóvenes</strong> potencien su desarrollo para una vida{' '}
            <strong className="text-luker-green font-bold">productiva gratificante</strong>
          </p>
        </div>
      </section>



      <div className="px-4 sm:px-6 mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Programas Activos</p>
          <p className="text-3xl font-black text-foreground mt-2">{totalProg}</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Indicadores Totales</p>
          <p className="text-3xl font-black text-foreground mt-2">{totalInd}</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Score Global Promedio</p>
          <p className="text-3xl font-black text-luker-brown mt-2">{avgScore}%</p>
        </div>

        <div className="bg-luker-red/5 rounded-xl p-5 border border-luker-red/20 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold text-luker-red uppercase tracking-wider">Indicadores Críticos</p>
          <p className="text-3xl font-black text-luker-red mt-2">{indsRojos}</p>
        </div>

      </div>

      <div className="mt-12 px-4 sm:px-6">
        <h3 className="text-2xl font-black text-foreground mb-6">Programas del Ciclo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progs.map(prog => {
            const score = programScores.find(s => s.programa === prog.nombre)
            const inds = indList.filter(i => i.programa === prog.nombre)
            
            return (
              <ProgramCard 
                key={prog.id} 
                programa={prog} 
                score={score} 
                indicadores={inds} 
              />
            )
          })}
        </div>
      </div>

    </div>
  )
}
