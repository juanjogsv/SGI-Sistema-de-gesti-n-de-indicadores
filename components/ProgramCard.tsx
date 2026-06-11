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
  
  const getEjeColor = (eje: string) => {
    const e = eje?.toLowerCase() || '';
    if (e.includes('educación') || e.includes('educacion')) return 'bg-luker-green/10 text-luker-green border-luker-green/20';
    if (e.includes('emprendimiento')) return 'bg-luker-orange/10 text-luker-orange border-luker-orange/20';
    if (e.includes('institucional')) return 'bg-luker-brown/10 text-luker-brown border-luker-brown/20';
    return 'bg-luker-teal/10 text-luker-teal border-luker-teal/20';
  }

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden flex flex-col transition-all hover:shadow-card-hover">
      {/* Header */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <span className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border mb-3 ${getEjeColor(programa.eje_trabajo)}`}>
            {programa.eje_trabajo || 'Sin Eje'}
          </span>
          <h3 className="text-lg font-black text-foreground leading-tight tracking-tight">{programa.nombre}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-foreground">
              {score?.score_ponderado !== null && score?.score_ponderado !== undefined ? `${score.score_ponderado}%` : '—'}
            </span>
            <SemaforoBadge nivel={score?.semaforo || 'gris'} />
          </div>
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
            title="Ver indicadores"
          >
            {expanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
          </button>
        </div>
      </div>

      {/* Table */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left text-muted-foreground">
            <thead className="text-xs font-semibold text-muted-foreground/70 uppercase border-b border-border">
              <tr>
                <th className="pb-3 pr-4">Indicador</th>
                <th className="pb-3 px-4 whitespace-nowrap">C. Ef.</th>
                <th className="pb-3 px-4">Peso</th>
                <th className="pb-3 px-4">Semáforo</th>
                <th className="pb-3 pl-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {indicadores.map(ind => (
                <tr key={ind.indicador_id}>
                  <td className="py-3 pr-4 font-medium text-foreground min-w-[200px]">{ind.indicador}</td>
                  <td className="py-3 px-4 font-bold text-center">
                    {ind.valor_real === null ? <span className="text-muted-foreground/50">—</span> : `${ind.c_efectivo}%`}
                  </td>
                  <td className="py-3 px-4 text-center">{ind.peso_estrategico || '—'}</td>
                  <td className="py-3 px-4">
                     <SemaforoBadge nivel={ind.valor_real === null ? 'gris' : ind.semaforo} />
                  </td>
                  <td className="py-3 pl-4 text-xs text-muted-foreground whitespace-nowrap">
                    {ind.fecha_reporte ? new Date(ind.fecha_reporte).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {indicadores.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground/50">Sin indicadores asociados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
