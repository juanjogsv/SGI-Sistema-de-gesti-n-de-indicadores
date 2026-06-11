'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type NivelLogico = 'resultado' | 'impacto' | 'producto' | 'proceso' | 'insumo'
type TipoDato = 'porcentaje' | 'absoluto' | 'indice' | 'cualitativo'
type Frecuencia = 'mensual' | 'trimestral' | 'semestral' | 'anual'

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
  nivel_logico: NivelLogico
  tipo_dato: TipoDato
  linea_base: number
  frecuencia_reporte: Frecuencia
  es_inverso: boolean
  observaciones: string | null
  programa_id: string
}

interface Props {
  initialIndicadores: Indicador[]
  programas: Programa[]
  ciclos: Ciclo[]
}

const EMPTY_FORM = {
  nombre: '',
  nivel_logico: 'resultado' as NivelLogico,
  tipo_dato: 'porcentaje' as TipoDato,
  linea_base: 0,
  frecuencia_reporte: 'mensual' as Frecuencia,
  es_inverso: false,
  observaciones: '',
  programa_id: '',
}

const NIVEL_LABELS: Record<NivelLogico, string> = {
  resultado: 'Resultado',
  impacto: 'Impacto',
  producto: 'Producto',
  proceso: 'Proceso',
  insumo: 'Insumo',
}

const TIPO_LABELS: Record<TipoDato, string> = {
  porcentaje: 'Porcentaje (%)',
  absoluto: 'Valor Absoluto',
  indice: 'Índice',
  cualitativo: 'Cualitativo',
}

const FRECUENCIA_LABELS: Record<Frecuencia, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

export default function IndicadoresClient({ initialIndicadores, programas, ciclos }: Props) {
  const supabase = createClient()
  const [indicadores, setIndicadores] = useState<Indicador[]>(initialIndicadores)
  const [filtroCiclo, setFiltroCiclo] = useState<string>('')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Indicador | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const programasDeCiclo = filtroCiclo
    ? programas.filter(p => p.ciclo_id === filtroCiclo)
    : programas

  const indicadoresFiltrados = indicadores.filter(i => {
    if (filtroPrograma) return i.programa_id === filtroPrograma
    if (filtroCiclo) return programasDeCiclo.some(p => p.id === i.programa_id)
    return true
  })

  const programaNombre = (programa_id: string) =>
    programas.find(p => p.id === programa_id)?.nombre ?? '—'

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, programa_id: filtroPrograma })
    setIsModalOpen(true)
  }

  const openEdit = (ind: Indicador) => {
    setEditTarget(ind)
    setForm({
      nombre: ind.nombre,
      nivel_logico: ind.nivel_logico,
      tipo_dato: ind.tipo_dato,
      linea_base: ind.linea_base,
      frecuencia_reporte: ind.frecuencia_reporte,
      es_inverso: ind.es_inverso,
      observaciones: ind.observaciones ?? '',
      programa_id: ind.programa_id,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      nombre: form.nombre,
      nivel_logico: form.nivel_logico,
      tipo_dato: form.tipo_dato,
      linea_base: form.linea_base,
      frecuencia_reporte: form.frecuencia_reporte,
      es_inverso: form.es_inverso,
      observaciones: form.observaciones || null,
      programa_id: form.programa_id,
    }

    if (editTarget) {
      const { error } = await supabase.from('indicadores').update(payload).eq('id', editTarget.id)
      if (!error) {
        setIndicadores(indicadores.map(i => i.id === editTarget.id ? { ...i, ...payload } : i))
      } else {
        alert('Error al actualizar: ' + error.message)
      }
    } else {
      const { data, error } = await supabase.from('indicadores').insert(payload).select().single()
      if (!error && data) {
        setIndicadores([data, ...indicadores])
      } else {
        alert('Error al crear: ' + error?.message)
      }
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este indicador? También se eliminarán sus metas y políticas.')) return
    const { error } = await supabase.from('indicadores').delete().eq('id', id)
    if (!error) {
      setIndicadores(indicadores.filter(i => i.id !== id))
    } else {
      alert('Error al eliminar: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filtroCiclo}
            onChange={e => { setFiltroCiclo(e.target.value); setFiltroPrograma('') }}
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="">Todos los ciclos</option>
            {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select
            value={filtroPrograma}
            onChange={e => setFiltroPrograma(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          >
            <option value="">Todos los programas</option>
            {programasDeCiclo.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Nuevo Indicador
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Programa</th>
              <th className="p-4 font-semibold text-gray-600">Nivel</th>
              <th className="p-4 font-semibold text-gray-600">Tipo</th>
              <th className="p-4 font-semibold text-gray-600">Frecuencia</th>
              <th className="p-4 font-semibold text-gray-600">Inverso</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indicadoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500 italic">
                  No hay indicadores. Crea el primero.
                </td>
              </tr>
            ) : (
              indicadoresFiltrados.map(ind => (
                <tr key={ind.id} className="bg-white hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900 max-w-[200px]">
                    <span className="line-clamp-2">{ind.nombre}</span>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{programaNombre(ind.programa_id)}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {NIVEL_LABELS[ind.nivel_logico]}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{TIPO_LABELS[ind.tipo_dato]}</td>
                  <td className="p-4 text-gray-600 text-xs">{FRECUENCIA_LABELS[ind.frecuencia_reporte]}</td>
                  <td className="p-4 text-xs">
                    {ind.es_inverso ? (
                      <span className="text-orange-600 font-bold">Sí</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEdit(ind)} className="text-[#1F4E79] font-bold text-xs hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(ind.id)} className="text-red-500 font-bold text-xs hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-900 mb-4">
              {editTarget ? 'Editar Indicador' : 'Nuevo Indicador'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Programa</label>
                <select
                  required
                  value={form.programa_id}
                  onChange={e => setForm({ ...form, programa_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                >
                  <option value="">Selecciona un programa...</option>
                  {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Indicador</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nivel Lógico</label>
                  <select
                    value={form.nivel_logico}
                    onChange={e => setForm({ ...form, nivel_logico: e.target.value as NivelLogico })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                  >
                    {Object.entries(NIVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Dato</label>
                  <select
                    value={form.tipo_dato}
                    onChange={e => setForm({ ...form, tipo_dato: e.target.value as TipoDato })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                  >
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Frecuencia de Reporte</label>
                  <select
                    value={form.frecuencia_reporte}
                    onChange={e => setForm({ ...form, frecuencia_reporte: e.target.value as Frecuencia })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                  >
                    {Object.entries(FRECUENCIA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Línea Base</label>
                  <input
                    type="number"
                    step="any"
                    value={form.linea_base}
                    onChange={e => setForm({ ...form, linea_base: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="es_inverso"
                  type="checkbox"
                  checked={form.es_inverso}
                  onChange={e => setForm({ ...form, es_inverso: e.target.checked })}
                  className="w-4 h-4 accent-[#1F4E79]"
                />
                <label htmlFor="es_inverso" className="text-sm font-bold text-gray-700">
                  Indicador Inverso{' '}
                  <span className="font-normal text-gray-500">(menor valor = mejor resultado)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones <span className="font-normal text-gray-400">(opcional)</span></label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none resize-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-600 font-bold px-4 py-2 hover:bg-gray-50 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                  {isSaving ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Crear Indicador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
