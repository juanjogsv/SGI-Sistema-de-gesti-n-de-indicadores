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
  activo?: boolean
}

interface Programa {
  id: string
  nombre: string
  ciclo_id: string
}

interface Indicador {
  id: string
  nombre: string
  nivel_logico_id: string
  tipo_dato_id: string
  linea_base: number
  frecuencia_reporte_id: string
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
  nivel_logico_id: '',
  tipo_dato_id: '',
  linea_base: 0,
  frecuencia_reporte_id: '',
  es_inverso: false,
  observaciones: '',
  programa_id: '',
}

export default function IndicadoresClient({ initialIndicadores, programas, ciclos, catTipos, catNiveles, catFrecuencias }: Props) {
  const supabase = createClient()
  const [indicadores, setIndicadores] = useState<Indicador[]>(initialIndicadores)
  const [filtroCiclo, setFiltroCiclo] = useState<string>(ciclos.find(c => c.activo)?.id ?? '')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Indicador | null>(null)
  const [form, setForm] = useState({ 
    ...EMPTY_FORM, 
    nivel_logico_id: catNiveles[0]?.id ?? '', 
    tipo_dato_id: catTipos[0]?.id ?? '', 
    frecuencia_reporte_id: catFrecuencias[0]?.id ?? '' 
  })
  const [isSaving, setIsSaving] = useState(false)

  const nivelNombre = (id: string) => catNiveles.find(n => n.id === id)?.nombre ?? '—'
  const tipoNombre = (id: string) => catTipos.find(t => t.id === id)?.nombre ?? '—'
  const frecNombre = (id: string) => catFrecuencias.find(f => f.id === id)?.nombre ?? '—'

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
      nivel_logico_id: catNiveles[0]?.id ?? '',
      tipo_dato_id: catTipos[0]?.id ?? '',
      linea_base: 0,
      frecuencia_reporte_id: catFrecuencias[0]?.id ?? '',
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
      nivel_logico_id: ind.nivel_logico_id,
      tipo_dato_id: ind.tipo_dato_id,
      linea_base: ind.linea_base,
      frecuencia_reporte_id: ind.frecuencia_reporte_id,
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
      nivel_logico_id: form.nivel_logico_id,
      tipo_dato_id: form.tipo_dato_id,
      linea_base: form.linea_base,
      frecuencia_reporte_id: form.frecuencia_reporte_id,
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
            <option value="">Todos los programas / iniciativas</option>
            {programasDeCiclo.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <ImportarExcel
              templateName="Plantilla_Indicadores"
              cols={[
                { key: 'nombre', header: 'Nombre Indicador', required: true, type: 'string' },
                { key: 'programa_nombre', header: 'Programa', required: true, type: 'string' },
                { key: 'nivel_logico_id', header: 'Nivel Lógico', required: true, type: 'string' },
                { key: 'tipo_dato_id', header: 'Tipo de Dato', required: true, type: 'string' },
                { key: 'linea_base', header: 'Línea Base', required: true, type: 'number' },
                { key: 'frecuencia_reporte_id', header: 'Frecuencia de Reporte', type: 'string' },
                { key: 'es_inverso', header: 'Es Inverso', type: 'boolean' },
                { key: 'observaciones', header: 'Observaciones', type: 'string' },
              ]}
              validations={{
                programa_nombre: programas.map(p => p.nombre),
                nivel_logico_id: catNiveles.map(n => n.nombre),
                tipo_dato_id: catTipos.map(t => t.nombre),
                frecuencia_reporte_id: catFrecuencias.map(f => f.nombre),
                es_inverso: ['true', 'false']
              }}
              templateRows={programas.map(p => ({
                nombre: '', programa_nombre: p.nombre,
                nivel_logico_id: catNiveles[0]?.nombre ?? '', tipo_dato_id: catTipos[0]?.nombre ?? '',
                linea_base: 0, frecuencia_reporte_id: catFrecuencias[0]?.nombre ?? '', es_inverso: 'false', observaciones: ''
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
                  nivel_logico_id: catNiveles.find(n => n.nombre === row.nivel_logico_id)?.id ?? '',
                  tipo_dato_id: catTipos.find(t => t.nombre === row.tipo_dato_id)?.id ?? '',
                  linea_base: row.linea_base as number,
                  frecuencia_reporte_id: catFrecuencias.find(f => f.nombre === row.frecuencia_reporte_id)?.id || catFrecuencias[0]?.id,
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
              <th className="p-4 font-semibold text-muted-foreground/80">Programa / Iniciativa</th>
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
                  <td className="p-4 text-xs">{nivelNombre(ind.nivel_logico_id)}</td>
                  <td className="p-4 text-muted-foreground/80 text-xs">{tipoNombre(ind.tipo_dato_id)}</td>
                  <td className="p-4 text-muted-foreground/80 text-xs">{frecNombre(ind.frecuencia_reporte_id)}</td>
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
                <label className="block text-sm font-bold text-foreground/90 mb-1">Programa / Iniciativa</label>
                <select
                  required
                  value={form.programa_id}
                  onChange={e => setForm({ ...form, programa_id: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                >
                  <option value="">Selecciona un programa / iniciativa...</option>
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
                    required
                    value={form.nivel_logico_id}
                    onChange={e => setForm({ ...form, nivel_logico_id: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {catNiveles.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Tipo de Dato</label>
                  <select
                    required
                    value={form.tipo_dato_id}
                    onChange={e => setForm({ ...form, tipo_dato_id: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {catTipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground/90 mb-1">Frecuencia de Reporte</label>
                  <select
                    value={form.frecuencia_reporte_id}
                    onChange={e => setForm({ ...form, frecuencia_reporte_id: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                  >
                    {catFrecuencias.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
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
