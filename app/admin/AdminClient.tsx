'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Ciclo {
  id: string
  nombre: string
  anio: number
  activo: boolean
}

export default function AdminClient({ initialCiclos }: { initialCiclos: Ciclo[] }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [ciclos, setCiclos] = useState<Ciclo[]>(initialCiclos)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [nombre, setNombre] = useState('')
  const [anio, setAnio] = useState<number>(new Date().getFullYear())

  const handleToggleActivo = async (id: string, currentActivo: boolean) => {
    // Si ya está activo, no hacemos nada (el usuario debe activar otro para desactivar este)
    if (currentActivo) return

    setIsSaving(true)
    
    // 1. Apagar todos
    await supabase.from('ciclos').update({ activo: false }).neq('id', '00000000-0000-0000-0000-000000000000') // hack to target all rows

    // 2. Encender el seleccionado
    await supabase.from('ciclos').update({ activo: true }).eq('id', id)

    // Actualizar state local
    setCiclos(ciclos.map(c => ({ ...c, activo: c.id === id })))
    setIsSaving(false)
    router.refresh() // recarga server components
  }

  const handleCreateCiclo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const { data, error } = await supabase.from('ciclos').insert({
      nombre,
      anio,
      activo: ciclos.length === 0 // si es el primero, lo activa por defecto
    }).select().single()

    setIsSaving(false)

    if (error) {
      alert("Error al crear el ciclo: " + error.message)
    } else if (data) {
      setCiclos([data, ...ciclos])
      setIsModalOpen(false)
      setNombre('')
      setAnio(new Date().getFullYear())
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Tarjeta de Gestión de Ciclos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-black text-gray-900">Ciclos de Operación</h2>
            <p className="text-sm text-gray-500">Los ciclos representan los periodos anuales. Solo un ciclo puede estar activo a la vez.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            + Nuevo Ciclo
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nombre</th>
                <th className="p-4 font-semibold text-gray-600">Año</th>
                <th className="p-4 font-semibold text-gray-600">Estado</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ciclos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium italic">
                    No hay ciclos creados. Crea el primero para comenzar a usar la plataforma.
                  </td>
                </tr>
              ) : (
                ciclos.map(c => (
                  <tr key={c.id} className={c.activo ? "bg-[#f0f5fa]" : "bg-white"}>
                    <td className="p-4 font-black text-gray-900">{c.nombre}</td>
                    <td className="p-4 text-gray-600">{c.anio}</td>
                    <td className="p-4">
                      {c.activo ? (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!c.activo && (
                        <button 
                          disabled={isSaving}
                          onClick={() => handleToggleActivo(c.id, c.activo)}
                          className="text-[#1F4E79] font-bold text-xs hover:underline disabled:opacity-50"
                        >
                          Marcar Activo
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-xl font-black text-gray-900 mb-4">Crear Nuevo Ciclo</h3>
            <form onSubmit={handleCreateCiclo} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre (ej. 2024)</label>
                <input 
                  required
                  type="text" 
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Año</label>
                <input 
                  required
                  type="number" 
                  value={anio}
                  onChange={e => setAnio(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                />
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
                  className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Crear Ciclo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
