import React from 'react'
import { Search, ShieldAlert, Plus } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-fade-in">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Administra accesos y roles a nivel global y por programa</p>
        </div>
        <button className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <ShieldAlert className="w-4 h-4 text-brand-500" />
            <span>Nivel de Acceso: Administrador</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol Global</th>
                <th className="px-6 py-4">Programas Asignados</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="hover:bg-brand-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">Admin Prueba</td>
                <td className="px-6 py-4 text-gray-500">admin@fundacionluker.org.co</td>
                <td className="px-6 py-4">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">ADMIN</span>
                </td>
                <td className="px-6 py-4 text-gray-500">Acceso Total</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-brand-500 hover:text-brand-700 font-semibold text-xs uppercase tracking-wider">Editar</button>
                </td>
              </tr>
              <tr className="hover:bg-brand-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">Juan Gómez</td>
                <td className="px-6 py-4 text-gray-500">jgomez@fundacionluker.org.co</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">EDITOR</span>
                </td>
                <td className="px-6 py-4 text-gray-500">ATAL, EACTIVA</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-brand-500 hover:text-brand-700 font-semibold text-xs uppercase tracking-wider">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
