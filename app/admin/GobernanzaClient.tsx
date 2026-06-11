'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Accion = 'INSERT' | 'UPDATE' | 'DELETE'

interface AuditRow {
  id: string
  entidad: string
  entidad_id: string
  accion: Accion
  usuario_id: string | null
  timestamp: string
  payload_diff: Record<string, unknown> | null
}

interface Usuario {
  id: string
  nombre: string
  email: string
}

interface Props {
  usuarios: Usuario[]
}

const ACCION_COLORS: Record<Accion, string> = {
  INSERT: 'bg-green-100 text-green-700 border-green-200',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
}

const PAGE_SIZE = 20

export default function GobernanzaClient({ usuarios }: Props) {
  const supabase = createClient()
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filtros
  const [filtroEntidad, setFiltroEntidad] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const fetchLogs = useCallback(async (p: number) => {
    setIsLoading(true)

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1)

    if (filtroEntidad) query = query.eq('entidad', filtroEntidad)
    if (filtroAccion) query = query.eq('accion', filtroAccion)
    if (filtroUsuario) query = query.eq('usuario_id', filtroUsuario)
    if (filtroDesde) query = query.gte('timestamp', filtroDesde)
    if (filtroHasta) query = query.lte('timestamp', filtroHasta + 'T23:59:59Z')

    const { data, count } = await query
    setLogs((data as AuditRow[]) || [])
    setTotal(count || 0)
    setIsLoading(false)
  }, [supabase, filtroEntidad, filtroAccion, filtroUsuario, filtroDesde, filtroHasta])

  useEffect(() => {
    setPage(0)
  }, [filtroEntidad, filtroAccion, filtroUsuario, filtroDesde, filtroHasta])

  useEffect(() => {
    fetchLogs(page)
  }, [page, fetchLogs])

  const usuarioNombre = (id: string | null) => {
    if (!id) return 'Sistema'
    const u = usuarios.find(u => u.id === id)
    return u ? u.nombre : id.slice(0, 8) + '...'
  }

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="Entidad (ej: programas)"
          value={filtroEntidad}
          onChange={e => setFiltroEntidad(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-luker-brown"
        />
        <select
          value={filtroAccion}
          onChange={e => setFiltroAccion(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Todas las acciones</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select
          value={filtroUsuario}
          onChange={e => setFiltroUsuario(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown"
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>
        <input
          type="date"
          value={filtroDesde}
          onChange={e => setFiltroDesde(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-luker-brown"
          title="Desde"
        />
        <input
          type="date"
          value={filtroHasta}
          onChange={e => setFiltroHasta(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-luker-brown"
          title="Hasta"
        />
      </div>

      {/* Conteo */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span><strong className="text-foreground">{total}</strong> registros encontrados</span>
        {(filtroEntidad || filtroAccion || filtroUsuario || filtroDesde || filtroHasta) && (
          <button
            onClick={() => { setFiltroEntidad(''); setFiltroAccion(''); setFiltroUsuario(''); setFiltroDesde(''); setFiltroHasta('') }}
            className="text-luker-brown font-bold text-xs hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80">Fecha y Hora</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Entidad</th>
              <th className="p-4 font-semibold text-muted-foreground/80">ID Registro</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Acción</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Usuario</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground/50 animate-pulse">Cargando registros...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground/50 italic">No hay registros con los filtros actuales.</td>
              </tr>
            ) : (
              logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr className="bg-card hover:bg-muted/30">
                    <td className="p-4 text-muted-foreground/80 whitespace-nowrap text-xs">{formatTimestamp(log.timestamp)}</td>
                    <td className="p-4 font-bold text-foreground">{log.entidad}</td>
                    <td className="p-4 text-muted-foreground/50 text-xs font-mono">{log.entidad_id?.slice(0, 8)}…</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ACCION_COLORS[log.accion]}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-4 text-foreground/90 text-xs">{usuarioNombre(log.usuario_id)}</td>
                    <td className="p-4">
                      {log.payload_diff && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-luker-brown font-bold text-xs hover:underline"
                        >
                          {expandedId === log.id ? 'Ocultar' : 'Ver diff'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && log.payload_diff && (
                    <tr className="bg-muted/30">
                      <td colSpan={6} className="px-6 pb-4">
                        <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-auto max-h-48 leading-relaxed">
                          {JSON.stringify(log.payload_diff, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-border text-muted-foreground/80 hover:bg-muted/30 disabled:opacity-40 font-bold"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 rounded border border-border text-muted-foreground/80 hover:bg-muted/30 disabled:opacity-40 font-bold"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
