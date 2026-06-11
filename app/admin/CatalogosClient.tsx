'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CatItem {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
  orden: number
}

type Tabla = 'cat_tipos_dato' | 'cat_niveles_logico' | 'cat_frecuencias'

interface CatalogoConfig {
  tabla: Tabla
  label: string
  descripcionLabel: string
}

const CATALOGOS: CatalogoConfig[] = [
  { tabla: 'cat_tipos_dato',     label: 'Tipos de Dato',    descripcionLabel: 'Ej: Se usa cuando el valor es un porcentaje entre 0 y 100' },
  { tabla: 'cat_niveles_logico', label: 'Niveles Lógicos',  descripcionLabel: 'Ej: Nivel que representa el resultado final del programa' },
  { tabla: 'cat_frecuencias',    label: 'Frecuencias',      descripcionLabel: 'Ej: Reporte cada mes calendario' },
]

interface Props {
  initialData: Record<Tabla, CatItem[]>
}

const EMPTY_FORM = { codigo: '', nombre: '', descripcion: '', orden: 0 }

export default function CatalogosClient({ initialData }: Props) {
  const supabase = createClient()
  const [activeCat, setActiveCat] = useState<Tabla>('cat_tipos_dato')
  const [data, setData] = useState<Record<Tabla, CatItem[]>>(initialData)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CatItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = data[activeCat] ?? []
  const config = CATALOGOS.find(c => c.tabla === activeCat)!

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, orden: items.length + 1 })
    setError(null)
    setIsModalOpen(true)
  }

  const openEdit = (item: CatItem) => {
    setEditTarget(item)
    setForm({ codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion ?? '', orden: item.orden })
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const payload = {
      codigo: form.codigo.trim().toLowerCase().replace(/\s+/g, '_'),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      orden: form.orden,
    }

    if (editTarget) {
      const { data: updated, error: err } = await supabase
        .from(activeCat)
        .update({ nombre: payload.nombre, descripcion: payload.descripcion, orden: payload.orden })
        .eq('id', editTarget.id)
        .select()
        .single()

      if (err) { setError(err.message); setIsSaving(false); return }
      setData(prev => ({ ...prev, [activeCat]: prev[activeCat].map(i => i.id === editTarget.id ? updated : i) }))
    } else {
      const { data: created, error: err } = await supabase
        .from(activeCat)
        .insert(payload)
        .select()
        .single()

      if (err) { setError(err.message); setIsSaving(false); return }
      setData(prev => ({ ...prev, [activeCat]: [...prev[activeCat], created].sort((a, b) => a.orden - b.orden) }))
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  const handleToggleActivo = async (item: CatItem) => {
    const { error: err } = await supabase
      .from(activeCat)
      .update({ activo: !item.activo })
      .eq('id', item.id)

    if (!err) {
      setData(prev => ({
        ...prev,
        [activeCat]: prev[activeCat].map(i => i.id === item.id ? { ...i, activo: !item.activo } : i)
      }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector de catálogo */}
      <div className="flex gap-2 flex-wrap">
        {CATALOGOS.map(c => (
          <button
            key={c.tabla}
            onClick={() => setActiveCat(c.tabla)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
              activeCat === c.tabla
                ? 'bg-luker-brown text-white border-luker-brown'
                : 'bg-card text-muted-foreground/80 border-border hover:border-luker-brown hover:text-luker-brown'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Cabecera del catálogo activo */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-black text-foreground">{config.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.filter(i => i.activo).length} valores activos · {items.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          + Nuevo valor
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80 w-8">#</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Código</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Nombre</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Descripción</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Estado</th>
              <th className="p-4 font-semibold text-muted-foreground/80 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground/50 italic">
                  No hay valores. Agrega el primero.
                </td>
              </tr>
            ) : (
              [...items].sort((a, b) => a.orden - b.orden).map(item => (
                <tr key={item.id} className={item.activo ? 'bg-card hover:bg-muted/30' : 'bg-muted/30 opacity-60'}>
                  <td className="p-4 text-muted-foreground/50 text-xs">{item.orden}</td>
                  <td className="p-4">
                    <code className="bg-muted/50 text-foreground/90 text-xs px-2 py-0.5 rounded font-mono">
                      {item.codigo}
                    </code>
                  </td>
                  <td className="p-4 font-bold text-foreground">{item.nombre}</td>
                  <td className="p-4 text-muted-foreground text-xs max-w-[280px]">
                    {item.descripcion ?? <span className="italic text-gray-300">Sin descripción</span>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActivo(item)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                        item.activo
                          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-gray-200'
                      }`}
                    >
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-luker-brown font-bold text-xs hover:underline"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200 max-w-md w-full p-6">
            <h3 className="text-xl font-black text-foreground mb-1">
              {editTarget ? 'Editar valor' : 'Nuevo valor'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Catálogo: {config.label}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">
                  Código
                  <span className="font-normal text-muted-foreground/50 ml-1">(identificador interno, no se puede cambiar después)</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value })}
                  disabled={!!editTarget}
                  placeholder="ej: porcentaje"
                  className="w-full border border-border rounded-lg p-2 font-mono text-sm focus:ring-2 focus:ring-luker-brown focus:outline-none disabled:bg-muted/50 disabled:text-muted-foreground/50"
                />
                {!editTarget && (
                  <p className="text-xs text-muted-foreground/50 mt-1">Solo minúsculas y guiones bajos. Ej: <code>tipo_especial</code></p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Nombre visible</label>
                <input
                  required
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="ej: Porcentaje (%)"
                  className="w-full border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">
                  Descripción
                  <span className="font-normal text-muted-foreground/50 ml-1">(opcional)</span>
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder={config.descripcionLabel}
                  rows={2}
                  className="w-full border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-luker-brown focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/90 mb-1">Orden</label>
                <input
                  type="number"
                  min="1"
                  value={form.orden}
                  onChange={e => setForm({ ...form, orden: Number(e.target.value) })}
                  className="w-24 border border-border rounded-lg p-2 focus:ring-2 focus:ring-luker-brown focus:outline-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editTarget ? 'Guardar Cambios' : 'Crear valor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
