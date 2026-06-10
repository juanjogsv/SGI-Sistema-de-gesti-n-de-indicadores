import React from 'react'

export default function AdminPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-gray-500 mt-2 text-sm font-medium">Administra los roles globales y accesos por programa (Solo Admin)</p>
      </header>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <p className="text-gray-500 mb-4 font-medium">
          La gestión de roles de Supabase Auth y asignaciones se construirá en una iteración posterior.
        </p>
        <div className="inline-block bg-yellow-50 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-lg text-sm font-bold">
          Próximamente: Integración con Supabase Admin API
        </div>
      </div>
    </div>
  )
}
