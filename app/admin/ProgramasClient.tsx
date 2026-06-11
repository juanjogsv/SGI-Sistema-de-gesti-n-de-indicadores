'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImportarExcel from './ImportarExcel'

interface EjeTrabajo {
  id: string
  codigo: string
  nombre: string
  activo: boolean
  orden: number
}

interface Ciclo {
  id: string
  nombre: string
  anio: number
  activo?: boolean
}

interface Programa {
  id: string
  nombre: string
  eje_trabajo_id: string
  ciclo_id: string
}

interface Props {
  initialProgramas: Programa[]
  initialEjes: EjeTrabajo[]
  ciclos: Ciclo[]
}

const EMPTY_PROG = { nombre: '', eje_trabajo_id: '', ciclo_id: '' }
const EMPTY_EJE = { codigo: '', nombre: '', orden: 0 }

export default function ProgramasClient({ initialProgramas, initialEjes, ciclos }: Props) {
  const supabase = createClient()
  const [programas, setProgramas] = useState<Programa[]>(initialProgramas)
  const [ejes, setEjes] = useState<EjeTrabajo[]>(initialEjes)
  const [filtroCiclo, setFiltroCiclo] = useState<string>(ciclos.find(c => c.activo)?.id ?? '')
  const [showEjes, setShowEjes] = useState(false)

  // Programa modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Programa | null>(null)
  const [form, setForm] = useState(EMPTY_PROG)
  const [isSaving, setIsSaving] = useState(false)

  // Eje modal
  const [isEjeModalOpen, setIsEjeModalOpen] = useState(false)
  const [editEje, setEditEje] = useState<EjeTrabajo | null>(null)
  const [ejeForm, setEjeForm] = useState(EMPTY_EJE)
  const [isSavingEje, setIsSavingEje] = useState(false)
  const [ejeError, setEjeError] = useState<string | null>(null)

  const ejesActivos = ejes.filter(e => e.activo).sort((a, b) => a.orden - b.orden)
  const programasFiltrados = filtroCiclo ? programas.filter(p => p.ciclo_id === filtroCiclo) : programas
  const cicloNombre = (id: string) => ciclos.find(c => c.id === id)?.nombre ?? '—'
  const ejeNombre = (id: string) => ejes.find(e => e.id === id)?.nombre ?? '—'

  // --- Programas ---
  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_PROG, ciclo_id: filtroCiclo, eje_trabajo_id: ejesActivos[0]?.id ?? '' })
    setIsModalOpen(true)
  }
  const openEdit = (p: Programa) => {
    setEditTarget(p)
    setForm({ nombre: p.nombre, eje_trabajo_id: p.eje_trabajo_id, ciclo_id: p.ciclo_id })
    setIsModalOpen(true)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    if (editTarget) {
      const { error } = await supabase.from('programas').update(form).eq('id', editTarget.id)
      if (!error) setProgramas(programas.map(p => p.id === editTarget.id ? { ...p, ...form } : p))
      else alert('Error: ' + error.message)
    } else {
      const { data, error } = await supabase.from('programas').insert(form).select().single()
      if (!error && data) setProgramas([data, ...programas])
      else alert('Error: ' + error?.message)
    }
    setIsSaving(false)
    setIsModalOpen(false)
  }
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este programa? También se eliminarán sus indicadores.')) return
    const { error } = await supabase.from('programas').delete().eq('id', id)
    if (!error) setProgramas(programas.filter(p => p.id !== id))
    else alert('Error: ' + error.message)
  }

  // --- Ejes de trabajo ---
  const openCreateEje = () => {
    setEditEje(null)
    setEjeForm({ ...EMPTY_EJE, orden: ejes.length + 1 })
    setEjeError(null)
    setIsEjeModalOpen(true)
  }
  const openEditEje = (eje: EjeTrabajo) => {
    setEditEje(eje)
    setEjeForm({ codigo: eje.codigo, nombre: eje.nombre, orden: eje.orden })
    setEjeError(null)
    setIsEjeModalOpen(true)
  }
  const handleSubmitEje = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingEje(true)
    setEjeError(null)
    const payload = {
      codigo: ejeForm.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      nombre: ejeForm.nombre.trim(),
      orden: ejeForm.orden,
    }
    if (editEje) {
      const { data, error } = await supabase.from('cat_ejes_trabajo')
        .update({ nombre: payload.nombre, orden: payload.orden })
        .eq('id', editEje.id).select().single()
      if (error) { setEjeError(error.message); setIsSavingEje(false); return }
      setEjes(ejes.map(e => e.id === editEje.id ? data : e))
    } else {
      const { data, error } = await supabase.from('cat_ejes_trabajo').insert(payload).select().single()
      if (error) { setEjeError(error.message); setIsSavingEje(false); return }
      setEjes([...ejes, data].sort((a, b) => a.orden - b.orden))
    }
    setIsSavingEje(false)
    setIsEjeModalOpen(false)
  }
  const handleToggleEje = async (eje: EjeTrabajo) => {
    const { error } = await supabase.from('cat_ejes_trabajo').update({ activo: !eje.activo }).eq('id', eje.id)
    if (!error) setEjes(ejes.map(e => e.id === eje.id ? { ...e, activo: !eje.activo } : e))
  }

  return (
    <div className="space-y-6">
      {/* Panel colapsable: Ejes de Trabajo */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowEjes(v => !v)}
          className="w-full flex justify-between items-center px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        >
          <span className="text-sm font-bold text-foreground/90">
            Ejes de Trabajo
            <span className="ml-2 text-xs font-normal text-muted-foreground/50">({ejesActivos.length} activos)</span>
          </span>
          <span className="text-muted-foreground/50 text-xs">{showEjes ? '▲ Ocultar' : '▼ Gestionar'}</span>
        </button>

        {showEjes && (
          <div className="p-4 space-y-3 border-t border-border">
            <div className="flex justify-end">
              <button
                onClick={openCreateEje}
                className="text-sm bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-1.5 px-3 rounded-lg transition-colors"
              >
                + Nuevo Eje
              </button>
            </div>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="p-3 font-semibold text-muted-foreground/80 w-8">#</th>
                    <th className="p-3 font-semibold text-muted-foreground/80">Código</th>
                    <th className="p-3 font-semibold text-muted-foreground/80">Nombre</th>
                    <th className="p-3 font-semibold text-muted-foreground/80">Estado</th>
                    <th className="p-3 font-semibold text-muted-foreground/80 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ejes.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground/50 italic text-xs">Sin ejes. Crea el primero.</td></tr>
                  ) : (
                    [...ejes].sort((a, b) => a.orden - b.orden).map(eje => (
                      <tr key={eje.id} className={eje.activo ? 'bg-card' : 'bg-muted/30 opacity-60'}>
                        <td className="p-3 text-muted-foreground/50 text-xs">{eje.orden}</td>
                        <td className="p-3"><code className="bg-muted/50 text-foreground/90 text-xs px-1.5 py-0.5 rounded font-mono">{eje.codigo}</code></td>
                        <td className="p-3 font-bold text-foreground text-xs">{eje.nombre}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleEje(eje)}
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors ${
                              eje.activo
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-gray-200'
                            }`}
                          >
                            {eje.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => openEditEje(eje)} className="text-luker-brown font-bold text-xs hover:underline">Editar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Programas */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <select
          value={filtroCiclo}
          onChange={e => setFiltroCiclo(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Todos los ciclos</option>
          {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <div className="flex gap-2">
          <ImportarExcel
            templateName="Plantilla_Programas"
            cols={[
              { key: 'nombre', header: 'nombre', required: true, type: 'string' },
              { key: 'eje_trabajo', header: 'eje_trabajo', required: true, type: 'string' },
              { key: 'ciclo_nombre', header: 'ciclo_nombre', required: true, type: 'string' },
            ]}
            templateRows={ciclos.map(c => ({ nombre: '', eje_trabajo: ejesActivos[0]?.codigo ?? '', ciclo_nombre: c.nombre }))}
            onImport={async (rows) => {
              let ok = 0
              const errors: string[] = []
              for (const row of rows) {
                const ciclo = ciclos.find(c => c.nombre === row.ciclo_nombre)
                if (!ciclo) { errors.push(`Ciclo "${row.ciclo_nombre}" no encontrado`); continue }
                const { data, error } = await supabase.from('programas')
                  .insert({ nombre: row.nombre as string, eje_trabajo_id: ejesActivos.find(e => e.codigo === row.eje_trabajo || e.nombre === row.eje_trabajo)?.id ?? '', ciclo_id: ciclo.id })
                  .select().single()
                if (error) { errors.push(error.message); continue }
                if (data) { setProgramas(p => [data, ...p]); ok++ }
              }
              return { ok, errors }
            }}
          />
          <button
            onClick={openCreate}
            className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            + Nuevo Programa
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80">Nombre</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Eje de Trabajo</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Ciclo</th>
              <th className="p-4 font-semibold text-muted-foreground/80 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programasFiltrados.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">No hay programas{filtroCiclo ? ' para este ciclo' : ''}.</td></tr>
            ) : (
              programasFiltrados.map(p => (
                <tr key={p.id} className="bg-card hover:bg-muted/30">
                  <td className="p-4 font-bold text-foreground">{p.nombre}</td>
                  <td className="p-4 text-muted-foreground/80 text-xs">
                    <span className="bg-muted/50 px-2 py-0.5 rounded">{ejeNombre(p.eje_trabajo_id)}</span>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{cicloNombre(p.ciclo_id)}</td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEdit(p)} className="text-luker-brown font-bold text-xs hover:underline">Editar</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 font-bold text-xs hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Programa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200 max-w-md w-full p-6">
            <h3 className="text-xl font-black text-foreground mb-4">
              {editTarget ? 'Editar Programa' : 'Nuevo Programa'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Nombre</label>
                <input required type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Eje de Trabajo</label>
                <select required value={form.eje_trabajo_id} onChange={e => setForm({ ...form, eje_trabajo_id: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none">
                  <option value="">Selecciona un eje...</option>
                  {ejesActivos.map(eje => <option key={eje.id} value={eje.id}>{eje.nombre}</option>)}
                </select>
                <p className="text-xs text-muted-foreground/50 mt-1">Administra los ejes en el panel de arriba.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Ciclo</label>
                <select required value={form.ciclo_id} onChange={e => setForm({ ...form, ciclo_id: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none">
                  <option value="">Selecciona un ciclo...</option>
                  {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                  {isSaving ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Crear Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eje de Trabajo */}
      {isEjeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200 max-w-sm w-full p-6">
            <h3 className="text-xl font-black text-foreground mb-4">
              {editEje ? 'Editar Eje' : 'Nuevo Eje de Trabajo'}
            </h3>
            <form onSubmit={handleSubmitEje} className="space-y-4">

              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Nombre visible</label>
                <input required type="text" value={ejeForm.nombre} onChange={e => setEjeForm({ ...ejeForm, nombre: e.target.value })}
                  placeholder="ej: Educación"
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Orden</label>
                <input type="number" min="1" value={ejeForm.orden} onChange={e => setEjeForm({ ...ejeForm, orden: Number(e.target.value) })}
                  className="w-24 border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none" />
              </div>
              {ejeError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{ejeError}</div>}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsEjeModalOpen(false)} className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSavingEje} className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                  {isSavingEje ? 'Guardando...' : editEje ? 'Guardar' : 'Crear Eje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
