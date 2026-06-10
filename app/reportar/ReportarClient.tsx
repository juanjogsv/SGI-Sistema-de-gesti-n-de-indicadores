'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SemaforoBadge from '@/components/SemaforoBadge'

type SemaforoNivel = 'azul' | 'verde' | 'amarillo' | 'amarillo_oscuro' | 'rojo' | 'rojo_critico' | 'gris'

interface Indicador {
  id: string
  nombre: string
  programa_id: string
  linea_base: number
  es_inverso: boolean
  alfa_exceso: number | null
  tope_maximo: number | null
  rango_min: number | null
  rango_max: number | null
  valor_meta: number
}

interface Props {
  cicloId: string
  programas: { id: string; nombre: string }[]
  indicadores: Indicador[]
}

export default function ReportarClient({ cicloId, programas, indicadores }: Props) {
  const supabase = createClient()
  
  const [selectedPrograma, setSelectedPrograma] = useState('')
  const [selectedIndicadorId, setSelectedIndicadorId] = useState('')
  
  const [valorReal, setValorReal] = useState<string>('')
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0])
  const [observacion, setObservacion] = useState('')
  
  const [ultimoDato, setUltimoDato] = useState<number | null>(null)
  const [loadingUltimoDato, setLoadingUltimoDato] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Filtros
  const indicadoresFiltrados = indicadores.filter(i => i.programa_id === selectedPrograma)
  const indActivo = indicadores.find(i => i.id === selectedIndicadorId)

  // Cargar último dato aprobado cuando cambia el indicador
  useEffect(() => {
    async function fetchUltimo() {
      if (!selectedIndicadorId) {
        setUltimoDato(null)
        return
      }
      setLoadingUltimoDato(true)
      const { data } = await supabase
        .from('reportes')
        .select('valor_real')
        .eq('indicador_id', selectedIndicadorId)
        .eq('ciclo_id', cicloId)
        .eq('estado', 'aprobado')
        .order('fecha', { ascending: false })
        .limit(1)
        .single()
      
      setUltimoDato(data ? data.valor_real : null)
      setLoadingUltimoDato(false)
    }
    fetchUltimo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndicadorId, cicloId])

  // Lógica de cálculo en tiempo real
  let previewCEfectivo = ''
  let previewSemaforo: SemaforoNivel = 'gris'
  let advertenciaRango = ''

  if (indActivo && valorReal !== '' && !isNaN(Number(valorReal))) {
    const vr = Number(valorReal)
    const meta = indActivo.valor_meta
    const lb = indActivo.linea_base
    const denominador = meta - lb

    // Validar rangos
    if (indActivo.rango_min !== null && vr < indActivo.rango_min) {
      advertenciaRango = `El valor es menor al rango mínimo permitido (${indActivo.rango_min}).`
    } else if (indActivo.rango_max !== null && vr > indActivo.rango_max) {
      advertenciaRango = `El valor supera el rango máximo permitido (${indActivo.rango_max}).`
    }

    // Calcular C
    let c = 0
    if (denominador === 0) {
      c = vr >= meta ? 100 : (meta !== 0 ? (vr / meta) * 100 : 0)
    } else if (indActivo.es_inverso) {
      c = ((lb - vr) / (lb - meta)) * 100
    } else {
      c = ((vr - lb) / denominador) * 100
    }

    // Calcular C Efectivo
    let c_ef = c
    if (c > 100) {
      c_ef = 100 + (Math.sqrt(c - 100) * (indActivo.alfa_exceso || 4.5))
    }
    if (indActivo.tope_maximo !== null && c_ef > indActivo.tope_maximo) {
      c_ef = indActivo.tope_maximo
    }

    previewCEfectivo = c_ef.toFixed(2)

    // Semáforo
    if (c_ef > 100) previewSemaforo = 'azul'
    else if (c_ef >= 90) previewSemaforo = 'verde'
    else if (c_ef >= 67.5) previewSemaforo = 'amarillo'
    else if (c_ef >= 45) previewSemaforo = 'amarillo_oscuro'
    else if (c_ef >= 22.5) previewSemaforo = 'rojo'
    else previewSemaforo = 'rojo_critico'
  }

  const handleSave = async () => {
    if (!indActivo || valorReal === '' || isNaN(Number(valorReal))) return

    setIsSaving(true)
    setSaveSuccess(false)
    
    // Obtener auth del usuario
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      alert("Error: Sesión no encontrada.")
      setIsSaving(false)
      return
    }

    // Obtener usuario_id en nuestra tabla (asumiendo que coincide con auth.uid())
    // o supabase RLS y triggers hacen el enlace? El schema dice "creado_por uuid references usuarios(id)".
    // Necesitamos el id de la tabla `usuarios` que corresponde a auth_user_id.
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authData.user.id)
      .single()

    const userId = usuarioData?.id

    if (!userId) {
       alert("Error: Perfil de usuario no encontrado.")
       setIsSaving(false)
       return
    }

    const { error } = await supabase
      .from('reportes')
      .insert({
        indicador_id: selectedIndicadorId,
        ciclo_id: cicloId,
        valor_real: Number(valorReal),
        fecha: fecha,
        observacion: observacion || null,
        estado: 'borrador',
        creado_por: userId
      })

    if (error) {
      alert("Error al guardar: " + error.message)
    } else {
      setSaveSuccess(true)
      setValorReal('')
      setObservacion('')
      // clear success after 3s
      setTimeout(() => setSaveSuccess(false), 3000)
    }

    setIsSaving(false)
  }

  // Deshabilitar fecha futura
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
      
      {/* 1 y 2. Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Programa</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
            value={selectedPrograma}
            onChange={(e) => {
              setSelectedPrograma(e.target.value)
              setSelectedIndicadorId('')
            }}
          >
            <option value="">-- Seleccione un programa --</option>
            {programas.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Indicador</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none disabled:opacity-50"
            value={selectedIndicadorId}
            onChange={(e) => setSelectedIndicadorId(e.target.value)}
            disabled={!selectedPrograma}
          >
            <option value="">-- Seleccione un indicador --</option>
            {indicadoresFiltrados.map(i => (
              <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {indActivo && (
        <div className="animate-fade-in border-t border-gray-100 pt-8">
          
          {/* 3. Panel de contexto */}
          <div className="bg-[#f8fafc] border border-gray-200 rounded-lg p-5 mb-8 flex flex-col md:flex-row gap-6 justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Línea Base</p>
              <p className="text-xl font-black text-gray-900 mt-1">{indActivo.linea_base}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Valor Meta</p>
              <p className="text-xl font-black text-gray-900 mt-1">{indActivo.valor_meta}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Último Aprobado</p>
              <p className="text-xl font-black text-[#1F4E79] mt-1">
                {loadingUltimoDato ? '...' : (ultimoDato !== null ? ultimoDato : 'Sin dato')}
              </p>
            </div>
          </div>

          {/* 4. Formulario de ingreso y Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Valor Real *</label>
                  <input 
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                    value={valorReal}
                    onChange={(e) => setValorReal(e.target.value)}
                    placeholder="Ej. 85.5"
                  />
                  {advertenciaRango && (
                    <p className="text-yellow-600 text-xs font-bold mt-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                      ⚠️ {advertenciaRango}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Reporte *</label>
                  <input 
                    type="date"
                    max={hoy}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones (Opcional)</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-[#1F4E79] focus:outline-none min-h-[100px]"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Justifique el valor si es necesario..."
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving || valorReal === '' || isNaN(Number(valorReal))}
                  className="bg-[#1F4E79] hover:bg-[#163857] text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar borrador'}
                </button>
                {saveSuccess && (
                  <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded border border-green-200">
                    ¡Borrador guardado exitosamente!
                  </span>
                )}
              </div>
            </div>

            {/* 5. Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Preview en Vivo</h3>
              
              {valorReal !== '' && !isNaN(Number(valorReal)) ? (
                <>
                  <div className="mb-4">
                    <span className="text-5xl font-black text-gray-900">{previewCEfectivo}%</span>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase">C. Efectivo Resultante</p>
                  </div>
                  <SemaforoBadge nivel={previewSemaforo} />
                </>
              ) : (
                <p className="text-gray-400 font-medium italic">Ingrese un valor para ver el cálculo</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
