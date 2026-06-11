'use client'

import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'

export interface ColDef {
  key: string
  header: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'date'
}

interface Props {
  templateName: string
  cols: ColDef[]
  templateRows?: Record<string, string | number>[]
  onImport: (rows: Record<string, unknown>[]) => Promise<{ ok: number; errors: string[] }>
}

export default function ImportarExcel({ templateName, cols, templateRows = [], onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [rows, setRows] = useState<{ data: Record<string, unknown>; error?: string }[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null)

  const downloadTemplate = () => {
    const headers = cols.map(c => c.header)
    const data = [headers, ...templateRows.map(r => cols.map(c => r[c.key] ?? ''))]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = cols.map(() => ({ wch: 25 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, `${templateName}.xlsx`)
  }

  const parseValue = (raw: unknown, col: ColDef): { value: unknown; error?: string } => {
    if (raw === undefined || raw === null || raw === '') {
      if (col.required) return { value: null, error: `"${col.header}" es requerido` }
      return { value: null }
    }
    if (col.type === 'number') {
      const n = Number(raw)
      if (isNaN(n)) return { value: null, error: `"${col.header}" debe ser un número` }
      return { value: n }
    }
    if (col.type === 'boolean') {
      const s = String(raw).toLowerCase()
      return { value: s === 'true' || s === 'sí' || s === 'si' || s === '1' }
    }
    if (col.type === 'date') {
      if (typeof raw === 'number') {
        const d = new Date(Math.round((raw - 25569) * 86400 * 1000))
        return { value: d.toISOString().split('T')[0] }
      }
      const d = new Date(String(raw))
      if (isNaN(d.getTime())) return { value: null, error: `"${col.header}" fecha inválida` }
      return { value: d.toISOString().split('T')[0] }
    }
    return { value: String(raw) }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsParsing(true)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]

        const parsed = raw.map(row => {
          const data: Record<string, unknown> = {}
          const errors: string[] = []
          cols.forEach(col => {
            const raw = row[col.header]
            const { value, error } = parseValue(raw, col)
            data[col.key] = value
            if (error) errors.push(error)
          })
          return { data, error: errors.length ? errors.join(', ') : undefined }
        })
        setRows(parsed)
      } catch {
        alert('Error procesando el archivo. Usa la plantilla descargada.')
      } finally {
        setIsParsing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const validRows = rows.filter(r => !r.error)

  const handleImport = async () => {
    setIsImporting(true)
    const res = await onImport(validRows.map(r => r.data))
    setResult(res)
    setIsImporting(false)
    if (res.ok > 0) setRows([])
  }

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setRows([]); setResult(null) }}
        className="border border-luker-brown text-luker-brown hover:bg-[#f0f5fa] font-bold py-2 px-4 rounded-lg transition-colors text-sm"
      >
        Importar Excel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-card border border-border animate-in zoom-in-95 duration-200 w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-foreground">Importar desde Excel</h3>
                <p className="text-sm text-muted-foreground">{templateName}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground/50 hover:text-muted-foreground/80 text-xl font-bold">×</button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              {/* Paso 1 */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <p className="text-sm font-bold text-foreground/90 mb-2">1. Descarga la plantilla con las columnas correctas</p>
                <button onClick={downloadTemplate} className="text-sm text-luker-brown font-bold hover:underline">
                  Descargar plantilla .xlsx →
                </button>
              </div>

              {/* Paso 2 */}
              <div>
                <p className="text-sm font-bold text-foreground/90 mb-2">2. Sube el archivo completado</p>
                <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-luker-brown transition-colors">
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
                  <span className="text-3xl block mb-2">📂</span>
                  <span className="font-bold text-luker-brown text-sm">Haz clic para seleccionar archivo</span>
                  <span className="text-xs text-muted-foreground/50 block mt-1">.xlsx, .xls o .csv</span>
                </label>
                {isParsing && <p className="text-sm text-muted-foreground mt-2 animate-pulse">Procesando...</p>}
              </div>

              {/* Vista previa */}
              {rows.length > 0 && (
                <div>
                  <div className="flex gap-3 mb-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex-1 text-center">
                      <p className="text-xs font-bold text-green-600">Válidas</p>
                      <p className="text-2xl font-black text-green-700">{validRows.length}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex-1 text-center">
                      <p className="text-xs font-bold text-red-600">Con error</p>
                      <p className="text-2xl font-black text-red-700">{rows.length - validRows.length}</p>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-48 border border-border rounded-lg text-xs">
                    <table className="min-w-full">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-muted-foreground">Estado</th>
                          {cols.slice(0, 3).map(c => (
                            <th key={c.key} className="p-2 text-left text-muted-foreground">{c.header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map((r, i) => (
                          <tr key={i} className={r.error ? 'bg-red-50' : 'bg-card'}>
                            <td className="p-2">
                              {r.error
                                ? <span className="text-red-600 font-bold" title={r.error}>✗ Error</span>
                                : <span className="text-green-600 font-bold">✓ OK</span>
                              }
                            </td>
                            {cols.slice(0, 3).map(c => (
                              <td key={c.key} className="p-2 text-foreground/90">{String(r.data[c.key] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result && (
                <div className={`rounded-lg p-3 text-sm font-bold ${result.ok > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {result.ok > 0 && `✓ ${result.ok} registros importados correctamente.`}
                  {result.errors.length > 0 && (
                    <ul className="mt-1 font-normal list-disc pl-4">
                      {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg text-sm">
                Cerrar
              </button>
              {validRows.length > 0 && !result && (
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg text-sm disabled:opacity-50"
                >
                  {isImporting ? 'Importando...' : `Importar ${validRows.length} filas`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
