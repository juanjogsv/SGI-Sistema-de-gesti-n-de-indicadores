'use client'

import React, { useState } from 'react'
import Semaforo from '@/components/Semaforo'
import EvolucionChart from '@/components/EvolucionChart'
import { Filter, Search } from 'lucide-react'
import { Database } from '@/types/database'

type CuadroMandoRow = Database['public']['Views']['v_cuadro_mando']['Row']

interface ScoreData {
  programa: string
  score_ponderado: number | null
  semaforo: Database['public']['Enums']['semaforo_enum']
}

interface InteractiveDashboardProps {
  programas: { id: string; nombre: string; eje_trabajo: string }[]
  indicadores: CuadroMandoRow[]
  programScores: ScoreData[]
}

export default function InteractiveDashboard({ programas, indicadores, programScores }: InteractiveDashboardProps) {
  const [filterEje, setFilterEje] = useState('Todos')
  const [filterPrograma, setFilterPrograma] = useState('Todos')

  // Opciones de filtro
  const ejes = ['Todos', ...Array.from(new Set(programas.map(p => p.eje_trabajo)))]
  const progsFilteredByEje = programas.filter(p => filterEje === 'Todos' || p.eje_trabajo === filterEje)
  const nombresProgramas = ['Todos', ...Array.from(new Set(progsFilteredByEje.map(p => p.nombre)))]

  // Aplicar filtros
  const filteredProgramas = programas.filter(prog => {
    if (filterEje !== 'Todos' && prog.eje_trabajo !== filterEje) return false
    if (filterPrograma !== 'Todos' && prog.nombre !== filterPrograma) return false
    return true
  })

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard de Seguimiento</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Análisis de Indicadores del Ciclo Activo</p>
        </div>

        {/* Filtros Interactivos */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-glass border border-white/50">
          <div className="flex items-center gap-2 px-3 border-r border-gray-100">
            <Filter className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtros</span>
          </div>
          
          <select 
            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            value={filterEje}
            onChange={(e) => {
              setFilterEje(e.target.value)
              setFilterPrograma('Todos') // Reset programa al cambiar eje
            }}
          >
            {ejes.map(eje => <option key={eje} value={eje}>{eje === 'Todos' ? 'Eje de Trabajo (Todos)' : eje}</option>)}
          </select>

          <div className="w-px h-6 bg-gray-100"></div>

          <select 
            className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            value={filterPrograma}
            onChange={(e) => setFilterPrograma(e.target.value)}
          >
            {nombresProgramas.map(prog => <option key={prog} value={prog}>{prog === 'Todos' ? 'Programa (Todos)' : prog}</option>)}
          </select>
        </div>
      </header>

      {/* Gráfico Histórico */}
      <EvolucionChart />

      {/* Tarjetas de Programas */}
      <div className="space-y-8">
        {filteredProgramas.map((prog) => {
          const score = programScores.find(s => s.programa === prog.nombre)
          const inds = indicadores.filter(i => i.programa === prog.nombre)

          return (
            <div key={prog.id} className="glass-card overflow-hidden group">
              {/* Header del Programa */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100/50 relative">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                    {prog.eje_trabajo}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 group-hover:text-brand-600 transition-colors">{prog.nombre}</h2>
                </div>

                {score && (
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end relative z-10">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                      Score Global
                    </span>
                    <div className="flex items-center gap-4 bg-white/80 px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
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
                  <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4">Indicador</th>
                      <th className="px-6 py-4 w-48">Semáforo</th>
                      <th className="px-6 py-4 w-32">C. Efectivo</th>
                      <th className="px-6 py-4 w-32">C. Bruto</th>
                      <th className="px-6 py-4 w-24 text-center">Peso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inds.map((ind) => (
                      <tr key={ind.indicador_id} className="hover:bg-brand-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{ind.indicador}</p>
                          <p className="text-xs text-brand-500/70 mt-1 font-medium">{ind.nivel_logico}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Semaforo nivel={ind.semaforo} />
                        </td>
                        <td className="px-6 py-4 font-black text-gray-700">
                          {ind.c_efectivo !== null ? `${ind.c_efectivo}%` : 'N/D'}
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-medium">
                          {ind.c_pct !== null ? `${ind.c_pct}%` : 'N/D'}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-300">
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
