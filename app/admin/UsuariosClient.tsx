'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImportarExcel from './ImportarExcel'

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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-black text-foreground">Usuarios Registrados</h2>
          <p className="text-sm text-muted-foreground">Activa cuentas y asigna roles de permisos globales.</p>
        </div>
        <ImportarExcel
          templateName="Plantilla_Usuarios"
          cols={[
            { key: 'email', header: 'email', required: true, type: 'string' },
            { key: 'rol_global', header: 'rol_global', required: true, type: 'string' },
          ]}
          templateRows={usuarios.map(u => ({ email: u.email, rol_global: '' }))}
          onImport={async (rows) => {
            let ok = 0
            const errors: string[] = []
            const rolesValidos = ['admin', 'editor', 'validador', 'lector', 'auditor']
            for (const row of rows) {
              const u = usuarios.find(u => u.email === row.email)
              if (!u) { errors.push(`Usuario "${row.email}" no encontrado`); continue }
              if (!rolesValidos.includes(row.rol_global as string)) {
                errors.push(`Rol "${row.rol_global}" inválido para ${row.email}`); continue
              }
              const { error } = await supabase.from('usuarios').update({ rol_global: row.rol_global }).eq('id', u.id)
              if (error) { errors.push(error.message); continue }
              setUsuarios(prev => prev.map(uu => uu.id === u.id ? { ...uu, rol_global: row.rol_global as string } : uu))
              ok++
            }
            return { ok, errors }
          }}
        />
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80">Usuario</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Rol Global</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground font-medium italic">
                  No hay usuarios en la base de datos.
                </td>
              </tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id} className={!u.activo ? "bg-red-50/30" : "bg-card"}>
                  <td className="p-4">
                    <p className="font-black text-foreground">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <select
                      disabled={isSaving}
                      value={u.rol_global || 'lector'}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="border border-border rounded p-1 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
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
