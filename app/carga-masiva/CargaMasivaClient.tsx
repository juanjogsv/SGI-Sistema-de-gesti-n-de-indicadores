'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ValidacionRow {
  id: string
  nombre: string
  programa_id: string
  programa_nombre: string
}

interface Props {
  cicloId: string
  validacionData: ValidacionRow[]
}

interface ParsedRow {
  programa: string
  indicador: string
  valor_real: number | string
  fecha: string | number
  observacion: string
  // Estado validacion
  error?: string
  isValid: boolean
  indicador_id?: string
  fechaConvertida?: string
}

export default function CargaMasivaClient({ cicloId, validacionData }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleDownloadTemplate = () => {
    // Generar cabeceras
    const ws_data = [['programa', 'indicador', 'valor_real', 'fecha', 'observacion']]
    
    // Poblar con todos los indicadores válidos para que sea fácil
    validacionData.forEach(ind => {
      ws_data.push([ind.programa_nombre, ind.nombre, '', '', ''])
    })

    const ws = XLSX.utils.aoa_to_sheet(ws_data)
    
    // Auto size columnas
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 40 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla")
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva.xlsx")
  }

  const parseDate = (excelDate: number | string): string | null => {
    if (!excelDate) return null
    if (typeof excelDate === 'number') {
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000))
      return date.toISOString().split('T')[0]
    }
    // Si es string formato yyyy-mm-dd
    const parsed = new Date(excelDate)
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
    return null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, string | number>[]

        const validadas: ParsedRow[] = data.map((row, i) => {
          const r: ParsedRow = {
            programa: row.programa || '',
            indicador: row.indicador || '',
            valor_real: row.valor_real,
            fecha: row.fecha,
            observacion: row.observacion || '',
            isValid: true
          }

          // Validación 1: Programa + Indicador
          const matchingInd = validacionData.find(
            v => v.nombre.trim() === r.indicador.trim() && v.programa_nombre.trim() === r.programa.trim()
          )

          if (!matchingInd) {
            r.isValid = false
            r.error = 'Programa o Indicador no existe'
            return r
          }
          r.indicador_id = matchingInd.id

          // Validación 2: Valor numérico
          if (r.valor_real === undefined || r.valor_real === null || r.valor_real === '') {
             r.isValid = false
             r.error = 'Valor real vacío'
             return r
          }
          const numValue = Number(r.valor_real)
          if (isNaN(numValue)) {
            r.isValid = false
            r.error = 'Valor no numérico'
            return r
          }
          r.valor_real = numValue

          // Validación 3: Fecha
          const parsedDate = parseDate(r.fecha)
          if (!parsedDate) {
            r.isValid = false
            r.error = 'Fecha inválida'
            return r
          }
          r.fechaConvertida = parsedDate

          return r
        })

        setRows(validadas)
      } catch (err) {
        alert("Error procesando el archivo. Asegúrese de usar la plantilla.")
      } finally {
        setIsProcessing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    const validRows = rows.filter(r => r.isValid)
    if (validRows.length === 0) return

    setIsImporting(true)
    
    const { data: authData } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authData.user?.id)
      .single()

    const userId = usuarioData?.id

    if (!userId) {
       alert("Error: Perfil de usuario no encontrado.")
       setIsImporting(false)
       return
    }

    const payload = validRows.map(r => ({
      indicador_id: r.indicador_id,
      ciclo_id: cicloId,
      valor_real: r.valor_real as number,
      fecha: r.fechaConvertida,
      observacion: r.observacion || null,
      estado: 'borrador',
      creado_por: userId
    }))

    const { error } = await supabase.from('reportes').insert(payload)

    setIsImporting(false)

    if (error) {
      alert("Error en la importación masiva: " + error.message)
    } else {
      alert(`¡${validRows.length} reportes importados con éxito!`)
      router.push('/dashboard')
    }
  }

  const totalValid = rows.filter(r => r.isValid).length
  const totalError = rows.length - totalValid

  return (
    <div className="space-y-8">
      {/* Paso 1 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-black text-gray-900 mb-4">Paso 1: Descargar Plantilla</h2>
        <p className="text-sm text-gray-600 mb-4">
          La plantilla contiene todos los programas e indicadores activos listos para ser diligenciados.
          Solo debes llenar <code className="bg-gray-100 px-1 rounded">valor_real</code>, <code className="bg-gray-100 px-1 rounded">fecha</code> y <code className="bg-gray-100 px-1 rounded">observacion</code>.
        </p>
        <button 
          onClick={handleDownloadTemplate}
          className="bg-white border-2 border-[#1F4E79] text-[#1F4E79] hover:bg-[#f0f5fa] font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Descargar plantilla .xlsx
        </button>
      </div>

      {/* Paso 2 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-black text-gray-900 mb-4">Paso 2: Subir Archivo</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#1F4E79] transition-colors bg-gray-50">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <span className="text-4xl mb-3">📁</span>
            <span className="font-bold text-[#1F4E79] hover:underline">Haz clic para subir tu Excel</span>
            <span className="text-sm text-gray-500 mt-1">Solo archivos .xlsx o .xls</span>
          </label>
        </div>

        {isProcessing && <p className="mt-4 text-gray-500 font-bold animate-pulse">Procesando archivo...</p>}

        {rows.length > 0 && (
          <div className="mt-8">
            <div className="flex gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex-1">
                <p className="text-xs font-bold text-green-600 uppercase">Filas Válidas</p>
                <p className="text-2xl font-black text-green-700">{totalValid}</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex-1">
                <p className="text-xs font-bold text-red-600 uppercase">Con Errores</p>
                <p className="text-2xl font-black text-red-700">{totalError}</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Estado</th>
                    <th className="p-3 font-semibold text-gray-600">Programa</th>
                    <th className="p-3 font-semibold text-gray-600">Indicador</th>
                    <th className="p-3 font-semibold text-gray-600">Valor Real</th>
                    <th className="p-3 font-semibold text-gray-600">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, idx) => (
                    <tr key={idx} className={r.isValid ? 'bg-white' : 'bg-red-50/50'}>
                      <td className="p-3">
                        {r.isValid ? (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">OK</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded" title={r.error}>Error: {r.error}</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-gray-900">{r.programa}</td>
                      <td className="p-3 text-gray-600">{r.indicador}</td>
                      <td className="p-3 text-center">{r.valor_real}</td>
                      <td className="p-3 text-gray-500">{r.fechaConvertida || String(r.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paso 3 */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleImport}
                disabled={totalValid === 0 || isImporting}
                className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importando...' : `Importar ${totalValid} reportes válidos`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
