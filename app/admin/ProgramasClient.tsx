'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ciclo {
  id: string
  nombre: string
  anio: number
}

interface Programa {
  id: string
  nombre: string
  eje_trabajo: string
  ciclo_id: string
}

interface Props {
  initialProgramas: Programa[]
  ciclos: Ciclo[]
}

const EMPTY_FORM = { nombre: '', eje_trabajo: '', ciclo_id: '' }

export default function ProgramasClient({ initialProgramas, ciclos }: Props) {
  const supabase = createClient()
  const [programas, setProgramas] = useState<Programa[]>(initialProgramas)
  const [filtroCiclo, setFiltroCiclo] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Programa | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const programasFiltrados = filtroCiclo
    ? programas.filter(p => p.ciclo_id === filtroCiclo)
    : programas

  const cicloNombre = (ciclo_id: string) =>
    ciclos.find(c => c.id === ciclo_id)?.nombre ?? '—'

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, ciclo_id: filtroCiclo })
    setIsModalOpen(true)
  }

  const openEdit = (p: Programa) => {
    setEditTarget(p)
    setForm({ nombre: p.nombre, eje_trabajo: p.eje_trabajo, ciclo_id: p.ciclo_id })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (editTarget) {
      const { error } = await supabase
        .from('programas')
        .update({ nombre: form.nombre, eje_trabajo: form.eje_trabajo, ciclo_id: form.ciclo_id })
        .eq('id', editTarget.id)

      if (!error) {
        setProgramas(programas.map(p =>
          p.id === editTarget.id ? { ...p, ...form } : p
        ))
      } else {
        alert('Error al actualizar: ' + error.message)
      }
    } else {
      const { data, error } = await supabase
        .from('programas')
        .insert({ nombre: form.nombre, eje_trabajo: form.eje_trabajo, ciclo_id: form.ciclo_id })
        .select()
        .single()

      if (!error && data) {
        setProgramas([data, ...programas])
      } else {
        alert('Error al crear: ' + error?.message)
      }
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este programa? También se eliminarán sus indicadores asociados.')) return
    const { error } = await supabase.from('programas').delete().eq('id', id)
    if (!error) {
      setProgramas(programas.filter(p => p.id !== id))
    } else {
      alert('Error al eliminar: ' + error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <select
          value={filtroCiclo}
          onChange={e => setFiltroCiclo(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Todos los ciclos</option>
          {ciclos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
        >
          + Nuevo Programa
        </button>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nombre</th>
              <th className="p-4 font-semibold text-gray-600">Eje de Trabajo</th>
              <th className="p-4 font-semibold text-gray-600">Ciclo</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programasFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                  No hay programas{filtroCiclo ? ' para este ciclo' : ''}. Crea el primero.
                </td>
              </tr>
            ) : (
              programasFiltrados.map(p => (
                <tr key={p.id} className="bg-white hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{p.nombre}</td>
                  <td className="p-4 text-gray-600">{p.eje_trabajo}</td>
                  <td className="p-4 text-gray-500 text-xs">{cicloNombre(p.ciclo_id)}</td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-luker-brown font-bold text-xs hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-luker-red font-bold text-xs hover:underline"
                    >
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-card border border-border max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-foreground mb-4">
              {editTarget ? 'Editar Programa' : 'Nuevo Programa'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Eje de Trabajo</label>
                <input
                  required
                  type="text"
                  value={form.eje_trabajo}
                  onChange={e => setForm({ ...form, eje_trabajo: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ciclo</label>
                <select
                  required
                  value={form.ciclo_id}
                  onChange={e => setForm({ ...form, ciclo_id: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                >
                  <option value="">Selecciona un ciclo...</option>
                  {ciclos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 font-bold px-4 py-2 hover:bg-gray-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Crear Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
