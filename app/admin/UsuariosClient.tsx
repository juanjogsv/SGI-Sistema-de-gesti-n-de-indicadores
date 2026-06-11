'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UsuarioRow {
  id: string
  nombre: string
  email: string
  activo: boolean
  rol_global: string
}

export default function UsuariosClient({ initialUsuarios }: { initialUsuarios: UsuarioRow[] }) {
  const supabase = createClient()
  const [usuarios, setUsuarios] = useState(initialUsuarios)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateRole = async (id: string, nuevoRol: string) => {
    setIsSaving(true)
    const { error } = await supabase.from('usuarios').update({ rol_global: nuevoRol }).eq('id', id)
    if (!error) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, rol_global: nuevoRol } : u))
    }
    setIsSaving(false)
  }

  const handleToggleActivo = async (id: string, currentStatus: boolean) => {
    setIsSaving(true)
    const { error } = await supabase.from('usuarios').update({ activo: !currentStatus }).eq('id', id)
    if (!error) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: !currentStatus } : u))
    }
    setIsSaving(false)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-black text-gray-900">Usuarios Registrados</h2>
        <p className="text-sm text-gray-500">Activa cuentas y asigna roles de permisos globales.</p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Usuario</th>
              <th className="p-4 font-semibold text-gray-600">Rol Global</th>
              <th className="p-4 font-semibold text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500 font-medium italic">
                  No hay usuarios en la base de datos.
                </td>
              </tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id} className={!u.activo ? "bg-red-50/30" : "bg-white"}>
                  <td className="p-4">
                    <p className="font-black text-gray-900">{u.nombre}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <select
                      disabled={isSaving}
                      value={u.rol_global || 'lector'}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="border border-gray-300 rounded p-1 text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
                    >
                      <option value="admin">Administrador</option>
                      <option value="editor">Editor</option>
                      <option value="validador">Validador</option>
                      <option value="lector">Lector (Solo ver)</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      disabled={isSaving}
                      onClick={() => handleToggleActivo(u.id, u.activo)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        u.activo 
                          ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                      }`}
                    >
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
