'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import SemaforoBadge from './SemaforoBadge'

import { Database } from '@/types/database'

// Types
type SemaforoNivel = Database['public']['Enums']['semaforo_enum'] | 'gris'

type IndicadorRow = {
  indicador_id: string
  indicador: string
  valor_real: number | null
  c_efectivo: number | null
  peso_estrategico: number | null
  semaforo: SemaforoNivel
  fecha_reporte: string | null
}
type ScoreRow = { score_ponderado: number | null, semaforo: SemaforoNivel }

interface Props {
  programa: { id: string; nombre: string; eje_trabajo: string }
  score: ScoreRow | undefined
  indicadores: IndicadorRow[]
}

export default function ProgramCard({ programa, score, indicadores }: Props) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all">
      {/* Header */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{programa.eje_trabajo}</p>
          <h3 className="text-lg font-black text-gray-900 leading-tight">{programa.nombre}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-gray-900">
              {score?.score_ponderado !== null && score?.score_ponderado !== undefined ? `${score.score_ponderado}%` : '—'}
            </span>
            <SemaforoBadge nivel={score?.semaforo || 'gris'} />
          </div>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-full transition-colors"
            title="Ver indicadores"
          >
            {expanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Table */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="text-xs font-semibold text-gray-400 uppercase border-b border-gray-200">
              <tr>
                <th className="pb-3 pr-4">Indicador</th>
                <th className="pb-3 px-4 whitespace-nowrap">C. Ef.</th>
                <th className="pb-3 px-4">Peso</th>
                <th className="pb-3 px-4">Semáforo</th>
                <th className="pb-3 pl-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {indicadores.map(ind => (
                <tr key={ind.indicador_id}>
                  <td className="py-3 pr-4 font-medium text-gray-900 min-w-[200px]">{ind.indicador}</td>
                  <td className="py-3 px-4 font-bold text-center">
                    {ind.valor_real === null ? <span className="text-gray-400">—</span> : `${ind.c_efectivo}%`}
                  </td>
                  <td className="py-3 px-4 text-center">{ind.peso_estrategico || '—'}</td>
                  <td className="py-3 px-4">
                     <SemaforoBadge nivel={ind.valor_real === null ? 'gris' : ind.semaforo} />
                  </td>
                  <td className="py-3 pl-4 text-xs text-gray-500 whitespace-nowrap">
                    {ind.fecha_reporte ? new Date(ind.fecha_reporte).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {indicadores.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">Sin indicadores asociados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
