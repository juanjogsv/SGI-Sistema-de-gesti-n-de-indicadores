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

      <div className="relative overflow-hidden bg-gradient-to-br from-luker-brown via-[#3a1d0b] to-black rounded-2xl p-8 sm:p-12 mt-8 shadow-xl border border-luker-brown/50">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-luker-orange opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-luker-green opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-luker-teal opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 max-w-4xl">
          <span className="inline-block py-1 px-4 rounded-full bg-luker-orange/20 text-luker-orange font-bold text-xs tracking-widest uppercase mb-4 border border-luker-orange/30">
            Plataforma de Gestión Estratégica
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            Transformando vidas a través <br className="hidden sm:block"/> de la educación
          </h1>
          <p className="text-gray-300 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mt-4">
            Movilizamos palancas para que niños y jóvenes potencien su desarrollo para una vida productiva gratificante.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 mt-8">
        <Link href="/carga-masiva" className="group">
          <div className="bg-card rounded-lg border border-border p-8 shadow-card hover:shadow-card-hover transition-all flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 bg-luker-green/10 text-luker-green rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📥</span>
            </div>
            <h2 className="text-xl font-black text-foreground mb-3 tracking-tight">Carga Masiva</h2>
            <p className="text-muted-foreground font-medium text-sm">Sube datos para múltiples indicadores a la vez usando una plantilla de Excel.</p>
          </div>
        </Link>

        <Link href="/reportar" className="group">
          <div className="bg-card rounded-lg border border-border p-8 shadow-card hover:shadow-card-hover transition-all flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 bg-luker-orange/10 text-luker-orange rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">✍️</span>
            </div>
            <h2 className="text-xl font-black text-foreground mb-3 tracking-tight">Reporte Manual</h2>
            <p className="text-muted-foreground font-medium text-sm">Ingresa los datos de un indicador específico de forma manual y detallada.</p>
          </div>
        </Link>

        <Link href="/admin" className="group">
          <div className="bg-card rounded-lg border border-border p-8 shadow-card hover:shadow-card-hover transition-all flex flex-col items-center text-center h-full">
            <div className="w-16 h-16 bg-luker-brown/10 text-luker-brown rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚙️</span>
            </div>
            <h2 className="text-xl font-black text-foreground mb-3 tracking-tight">Configuración</h2>
            <p className="text-muted-foreground font-medium text-sm">Administra los ciclos de operación y los permisos de los usuarios del sistema.</p>
          </div>
        </Link>
      </div>

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
