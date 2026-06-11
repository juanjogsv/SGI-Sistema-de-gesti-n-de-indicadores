'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ciclo {
  id: string
  nombre: string
}

interface Programa {
  id: string
  nombre: string
  ciclo_id: string
}

interface Indicador {
  id: string
  nombre: string
  programa_id: string
}

interface Meta {
  id: string
  indicador_id: string
  ciclo_id: string
  valor_meta: number
  fecha_corte: string
}

interface Politica {
  id: string
  indicador_id: string
  ciclo_id: string
  pondera: boolean
  peso_estrategico: number
  alfa_exceso: number
  tope_maximo: number | null
  umbral_completitud: number
  rango_min: number | null
  rango_max: number | null
  dias_max_retraso: number
  justificacion: string | null
}

interface FilaCombinada {
  indicador: Indicador
  meta: Meta | null
  politica: Politica | null
}

interface Props {
  initialMetas: Meta[]
  initialPoliticas: Politica[]
  indicadores: Indicador[]
  programas: Programa[]
  ciclos: Ciclo[]
}

const EMPTY_META = { valor_meta: 0, fecha_corte: '' }
const EMPTY_POLITICA = {
  pondera: true,
  peso_estrategico: 1,
  alfa_exceso: 1,
  tope_maximo: '' as string | number,
  umbral_completitud: 0.8,
  rango_min: '' as string | number,
  rango_max: '' as string | number,
  dias_max_retraso: 5,
  justificacion: '',
}

export default function MetasPoliticasClient({ initialMetas, initialPoliticas, indicadores, programas, ciclos }: Props) {
  const supabase = createClient()
  const [metas, setMetas] = useState<Meta[]>(initialMetas)
  const [politicas, setPoliticas] = useState<Politica[]>(initialPoliticas)
  const [filtroCiclo, setFiltroCiclo] = useState<string>(ciclos.find(c => c.id)?.id ?? '')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIndicador, setSelectedIndicador] = useState<Indicador | null>(null)
  const [metaForm, setMetaForm] = useState(EMPTY_META)
  const [politicaForm, setPoliticaForm] = useState(EMPTY_POLITICA)
  const [isSaving, setIsSaving] = useState(false)

  const programasDeCiclo = filtroCiclo ? programas.filter(p => p.ciclo_id === filtroCiclo) : programas
  const indicadoresFiltrados = indicadores.filter(i => {
    if (filtroPrograma) return i.programa_id === filtroPrograma
    if (filtroCiclo) return programasDeCiclo.some(p => p.id === i.programa_id)
    return true
  })

  const filas: FilaCombinada[] = indicadoresFiltrados.map(ind => ({
    indicador: ind,
    meta: metas.find(m => m.indicador_id === ind.id && m.ciclo_id === filtroCiclo) ?? null,
    politica: politicas.find(p => p.indicador_id === ind.id && p.ciclo_id === filtroCiclo) ?? null,
  }))

  const programaNombre = (programa_id: string) =>
    programas.find(p => p.id === programa_id)?.nombre ?? '—'

  const openModal = (fila: FilaCombinada) => {
    setSelectedIndicador(fila.indicador)
    setMetaForm(fila.meta
      ? { valor_meta: fila.meta.valor_meta, fecha_corte: fila.meta.fecha_corte }
      : EMPTY_META
    )
    setPoliticaForm(fila.politica
      ? {
          pondera: fila.politica.pondera,
          peso_estrategico: fila.politica.peso_estrategico,
          alfa_exceso: fila.politica.alfa_exceso,
          tope_maximo: fila.politica.tope_maximo ?? '',
          umbral_completitud: fila.politica.umbral_completitud,
          rango_min: fila.politica.rango_min ?? '',
          rango_max: fila.politica.rango_max ?? '',
          dias_max_retraso: fila.politica.dias_max_retraso,
          justificacion: fila.politica.justificacion ?? '',
        }
      : EMPTY_POLITICA
    )
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIndicador || !filtroCiclo) return
    setIsSaving(true)

    const existingMeta = metas.find(m => m.indicador_id === selectedIndicador.id && m.ciclo_id === filtroCiclo)
    const existingPolitica = politicas.find(p => p.indicador_id === selectedIndicador.id && p.ciclo_id === filtroCiclo)

    const metaPayload = {
      indicador_id: selectedIndicador.id,
      ciclo_id: filtroCiclo,
      valor_meta: metaForm.valor_meta,
      fecha_corte: metaForm.fecha_corte,
    }

    const politicaPayload = {
      indicador_id: selectedIndicador.id,
      ciclo_id: filtroCiclo,
      pondera: politicaForm.pondera,
      peso_estrategico: politicaForm.peso_estrategico,
      alfa_exceso: politicaForm.alfa_exceso,
      tope_maximo: politicaForm.tope_maximo === '' ? null : Number(politicaForm.tope_maximo),
      umbral_completitud: politicaForm.umbral_completitud,
      rango_min: politicaForm.rango_min === '' ? null : Number(politicaForm.rango_min),
      rango_max: politicaForm.rango_max === '' ? null : Number(politicaForm.rango_max),
      dias_max_retraso: politicaForm.dias_max_retraso,
      justificacion: politicaForm.justificacion || null,
    }

    // Upsert Meta
    let newMeta: Meta | null = null
    if (existingMeta) {
      const { data } = await supabase.from('metas').update(metaPayload).eq('id', existingMeta.id).select().single()
      newMeta = data
    } else {
      const { data } = await supabase.from('metas').insert(metaPayload).select().single()
      newMeta = data
    }

    // Upsert Política
    let newPolitica: Politica | null = null
    if (existingPolitica) {
      const { data } = await supabase.from('politicas_calidad').update(politicaPayload).eq('id', existingPolitica.id).select().single()
      newPolitica = data
    } else {
      const { data } = await supabase.from('politicas_calidad').insert(politicaPayload).select().single()
      newPolitica = data
    }

    if (newMeta) {
      setMetas(prev => {
        const exists = prev.find(m => m.id === newMeta!.id)
        return exists ? prev.map(m => m.id === newMeta!.id ? newMeta! : m) : [...prev, newMeta!]
      })
    }
    if (newPolitica) {
      setPoliticas(prev => {
        const exists = prev.find(p => p.id === newPolitica!.id)
        return exists ? prev.map(p => p.id === newPolitica!.id ? newPolitica! : p) : [...prev, newPolitica!]
      })
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filtroCiclo}
          onChange={e => { setFiltroCiclo(e.target.value); setFiltroPrograma('') }}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Selecciona un ciclo...</option>
          {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          value={filtroPrograma}
          onChange={e => setFiltroPrograma(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Todos los programas</option>
          {programasDeCiclo.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {!filtroCiclo && (
          <p className="text-sm text-amber-600 font-medium">Selecciona un ciclo para ver y editar metas y políticas.</p>
        )}
      </div>

      <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Indicador</th>
              <th className="p-4 font-semibold text-gray-600">Programa</th>
              <th className="p-4 font-semibold text-gray-600">Meta</th>
              <th className="p-4 font-semibold text-gray-600">Pondera</th>
              <th className="p-4 font-semibold text-gray-600">Peso</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!filtroCiclo ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                  Selecciona un ciclo para comenzar.
                </td>
              </tr>
            ) : filas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                  No hay indicadores en este ciclo. Créalos primero en la pestaña de Indicadores.
                </td>
              </tr>
            ) : (
              filas.map(fila => (
                <tr key={fila.indicador.id} className="bg-white hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900 max-w-[180px]">
                    <span className="line-clamp-2">{fila.indicador.nombre}</span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{programaNombre(fila.indicador.programa_id)}</td>
                  <td className="p-4">
                    {fila.meta ? (
                      <span className="text-gray-900 font-semibold">{fila.meta.valor_meta}</span>
                    ) : (
                      <span className="text-amber-500 text-xs font-semibold">Sin definir</span>
                    )}
                  </td>
                  <td className="p-4">
                    {fila.politica ? (
                      fila.politica.pondera
                        ? <span className="text-green-700 font-bold text-xs">Sí</span>
                        : <span className="text-gray-400 text-xs">No</span>
                    ) : (
                      <span className="text-amber-500 text-xs font-semibold">Sin definir</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    {fila.politica ? fila.politica.peso_estrategico : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openModal(fila)}
                      className="text-luker-brown font-bold text-xs hover:underline"
                    >
                      {fila.meta || fila.politica ? 'Editar' : 'Configurar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedIndicador && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-card border border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-foreground mb-1">Meta y Política de Calidad</h3>
            <p className="text-sm text-gray-500 mb-6">{selectedIndicador.nombre}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección Meta */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-black text-gray-800 text-sm uppercase tracking-wide">Meta</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Valor Meta</label>
                    <input
                      required
                      type="number"
                      step="any"
                      value={metaForm.valor_meta}
                      onChange={e => setMetaForm({ ...metaForm, valor_meta: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Corte</label>
                    <input
                      required
                      type="date"
                      value={metaForm.fecha_corte}
                      onChange={e => setMetaForm({ ...metaForm, fecha_corte: e.target.value })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Política */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-black text-gray-800 text-sm uppercase tracking-wide">Política de Calidad</h4>

                <div className="flex items-center gap-3">
                  <input
                    id="pondera"
                    type="checkbox"
                    checked={politicaForm.pondera}
                    onChange={e => setPoliticaForm({ ...politicaForm, pondera: e.target.checked })}
                    className="w-4 h-4 accent-luker-brown"
                  />
                  <label htmlFor="pondera" className="text-sm font-bold text-gray-700">
                    Pondera en el score del programa
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Peso Estratégico
                      <span className="font-normal text-gray-400 ml-1">(relativo)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={politicaForm.peso_estrategico}
                      onChange={e => setPoliticaForm({ ...politicaForm, peso_estrategico: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Alfa Exceso
                      <span className="font-normal text-gray-400 ml-1">(factor sobre-cumplimiento)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={politicaForm.alfa_exceso}
                      onChange={e => setPoliticaForm({ ...politicaForm, alfa_exceso: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Umbral Completitud
                      <span className="font-normal text-gray-400 ml-1">(0-1)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={politicaForm.umbral_completitud}
                      onChange={e => setPoliticaForm({ ...politicaForm, umbral_completitud: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Días Máx. Retraso
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={politicaForm.dias_max_retraso}
                      onChange={e => setPoliticaForm({ ...politicaForm, dias_max_retraso: Number(e.target.value) })}
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Tope Máximo
                      <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={politicaForm.tope_maximo}
                      onChange={e => setPoliticaForm({ ...politicaForm, tope_maximo: e.target.value })}
                      placeholder="Sin límite"
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    {/* spacer */}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Rango Mín.
                      <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={politicaForm.rango_min}
                      onChange={e => setPoliticaForm({ ...politicaForm, rango_min: e.target.value })}
                      placeholder="—"
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Rango Máx.
                      <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={politicaForm.rango_max}
                      onChange={e => setPoliticaForm({ ...politicaForm, rango_max: e.target.value })}
                      placeholder="—"
                      className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Justificación
                    <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                  </label>
                  <textarea
                    value={politicaForm.justificacion}
                    onChange={e => setPoliticaForm({ ...politicaForm, justificacion: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-600 font-bold px-4 py-2 hover:bg-gray-50 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {isSaving ? 'Guardando...' : 'Guardar Meta y Política'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
