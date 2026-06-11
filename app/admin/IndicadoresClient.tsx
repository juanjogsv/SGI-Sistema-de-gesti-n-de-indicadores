'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImportarExcel from './ImportarExcel'

interface CatItem {
  id: string
  codigo: string
  nombre: string
  activo: boolean
}

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
  nivel_logico: string
  tipo_dato: string
  linea_base: number
  frecuencia_reporte: string
  es_inverso: boolean
  observaciones: string | null
  programa_id: string
}

interface Props {
  initialIndicadores: Indicador[]
  programas: Programa[]
  ciclos: Ciclo[]
  catTipos: CatItem[]
  catNiveles: CatItem[]
  catFrecuencias: CatItem[]
}

const EMPTY_FORM = {
  nombre: '',
  nivel_logico: '',
  tipo_dato: '',
  linea_base: 0,
  frecuencia_reporte: '',
  es_inverso: false,
  observaciones: '',
  programa_id: '',
}

export default function IndicadoresClient({ initialIndicadores, programas, ciclos, catTipos, catNiveles, catFrecuencias }: Props) {
  const supabase = createClient()
  const [indicadores, setIndicadores] = useState<Indicador[]>(initialIndicadores)
  const [filtroCiclo, setFiltroCiclo] = useState<string>('')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Indicador | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM, nivel_logico: catNiveles[0]?.codigo ?? '', tipo_dato: catTipos[0]?.codigo ?? '', frecuencia_reporte: catFrecuencias[0]?.codigo ?? '' })
  const [isSaving, setIsSaving] = useState(false)

  const nivelesActivos = catNiveles.filter(c => c.activo)
  const tiposActivos = catTipos.filter(c => c.activo)
  const frecuenciasActivas = catFrecuencias.filter(c => c.activo)

  const labelOf = (items: CatItem[], codigo: string) =>
    items.find(i => i.codigo === codigo)?.nombre ?? codigo

  const programasDeCiclo = filtroCiclo ? programas.filter(p => p.ciclo_id === filtroCiclo) : programas

  const indicadoresFiltrados = indicadores.filter(i => {
    if (filtroPrograma) return i.programa_id === filtroPrograma
    if (filtroCiclo) return programasDeCiclo.some(p => p.id === i.programa_id)
    return true
  })

  const programaNombre = (programa_id: string) =>
    programas.find(p => p.id === programa_id)?.nombre ?? '—'

  const openCreate = () => {
    setEditTarget(null)
    setForm({
      nombre: '',
      nivel_logico: nivelesActivos[0]?.codigo ?? '',
      tipo_dato: tiposActivos[0]?.codigo ?? '',
      linea_base: 0,
      frecuencia_reporte: frecuenciasActivas[0]?.codigo ?? '',
      es_inverso: false,
      observaciones: '',
      programa_id: filtroPrograma,
    })
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
            className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
          >
            <option value="">Todos los ciclos</option>
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
        </div>
        <div className="flex gap-2">
          <ImportarExcel
            templateName="Plantilla_Indicadores"
            cols={[
              { key: 'nombre', header: 'nombre', required: true, type: 'string' },
              { key: 'programa_nombre', header: 'programa_nombre', required: true, type: 'string' },
              { key: 'nivel_logico', header: 'nivel_logico', required: true, type: 'string' },
              { key: 'tipo_dato', header: 'tipo_dato', required: true, type: 'string' },
              { key: 'linea_base', header: 'linea_base', required: true, type: 'number' },
              { key: 'frecuencia_reporte', header: 'frecuencia_reporte', type: 'string' },
              { key: 'es_inverso', header: 'es_inverso', type: 'boolean' },
              { key: 'observaciones', header: 'observaciones', type: 'string' },
            ]}
            templateRows={programas.map(p => ({
              nombre: '', programa_nombre: p.nombre,
              nivel_logico: nivelesActivos[0]?.codigo ?? '', tipo_dato: tiposActivos[0]?.codigo ?? '',
              linea_base: 0, frecuencia_reporte: frecuenciasActivas[0]?.codigo ?? '', es_inverso: 'false', observaciones: ''
            }))}
            onImport={async (rows) => {
              let ok = 0
              const errors: string[] = []
              for (const row of rows) {
                const prog = programas.find(p => p.nombre === row.programa_nombre)
                if (!prog) { errors.push(`Programa "${row.programa_nombre}" no encontrado`); continue }
                const { data, error } = await supabase.from('indicadores').insert({
                  nombre: row.nombre as string,
                  programa_id: prog.id,
                  nivel_logico: row.nivel_logico as string,
                  tipo_dato: row.tipo_dato as string,
                  linea_base: row.linea_base as number,
                  frecuencia_reporte: (row.frecuencia_reporte as string) || frecuenciasActivas[0]?.codigo,
                  es_inverso: Boolean(row.es_inverso),
                  observaciones: (row.observaciones as string) || null,
                }).select().single()
                if (error) { errors.push(error.message); continue }
                if (data) { setIndicadores(i => [data, ...i]); ok++ }
              }
              return { ok, errors }
            }}
          />
          <button
            onClick={openCreate}
            className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            + Nuevo Indicador
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80">Nombre</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Programa</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Nivel</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Tipo</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Frecuencia</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Inverso</th>
              <th className="p-4 font-semibold text-muted-foreground/80 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indicadoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                  No hay indicadores. Crea el primero.
                </td>
              </tr>
            ) : (
              indicadoresFiltrados.map(ind => (
                <tr key={ind.id} className="bg-card hover:bg-muted/30">
                  <td className="p-4 font-bold text-foreground max-w-[200px]">
                    <span className="line-clamp-2">{ind.nombre}</span>
                  </td>
                  <td className="p-4 text-muted-foreground/80 text-xs">{programaNombre(ind.programa_id)}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {labelOf(catNiveles, ind.nivel_logico)}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground/80 text-xs">{labelOf(catTipos, ind.tipo_dato)}</td>
                  <td className="p-4 text-muted-foreground/80 text-xs">{labelOf(catFrecuencias, ind.frecuencia_reporte)}</td>
                  <td className="p-4 text-xs">
                    {ind.es_inverso
                      ? <span className="text-orange-600 font-bold">Sí</span>
                      : <span className="text-muted-foreground/50">No</span>}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEdit(ind)} className="text-luker-brown font-bold text-xs hover:underline">Editar</button>
                    <button onClick={() => handleDelete(ind.id)} className="text-red-500 font-bold text-xs hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-foreground mb-4">
              {editTarget ? 'Editar Indicador' : 'Nuevo Indicador'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Programa</label>
                <select
                  required
                  value={form.programa_id}
                  onChange={e => setForm({ ...form, programa_id: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                >
                  <option value="">Selecciona un programa...</option>
                  {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Nombre del Indicador</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Nivel Lógico</label>
                  <select
                    value={form.nivel_logico}
                    onChange={e => setForm({ ...form, nivel_logico: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {nivelesActivos.map(n => <option key={n.codigo} value={n.codigo}>{n.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Tipo de Dato</label>
                  <select
                    value={form.tipo_dato}
                    onChange={e => setForm({ ...form, tipo_dato: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {tiposActivos.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Frecuencia de Reporte</label>
                  <select
                    value={form.frecuencia_reporte}
                    onChange={e => setForm({ ...form, frecuencia_reporte: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {frecuenciasActivas.map(f => <option key={f.codigo} value={f.codigo}>{f.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Línea Base</label>
                  <input
                    type="number"
                    step="any"
                    value={form.linea_base}
                    onChange={e => setForm({ ...form, linea_base: Number(e.target.value) })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="es_inverso"
                  type="checkbox"
                  checked={form.es_inverso}
                  onChange={e => setForm({ ...form, es_inverso: e.target.checked })}
                  className="w-4 h-4 accent-luker-brown"
                />
                <label htmlFor="es_inverso" className="text-sm font-bold text-foreground/90">
                  Indicador Inverso{' '}
                  <span className="font-normal text-muted-foreground">(menor valor = mejor resultado)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">
                  Observaciones <span className="font-normal text-muted-foreground/50">(opcional)</span>
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                  rows={2}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none resize-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
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
