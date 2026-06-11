'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImportarExcel from './ImportarExcel'

interface Ciclo { id: string; nombre: string; activo?: boolean }
interface Programa { id: string; nombre: string; ciclo_id: string }
interface Indicador { id: string; nombre: string; programa_id: string }

interface Meta {
  id: string; indicador_id: string; ciclo_id: string
  valor_meta: number; fecha_corte: string
}

interface Politica {
  id: string; indicador_id: string; ciclo_id: string
  pondera: boolean; peso_estrategico: number; alfa_exceso: number
  tope_maximo: number | null; umbral_completitud: number
  rango_min: number | null; rango_max: number | null
  dias_max_retraso: number; justificacion: string | null
}

interface RowForm {
  valor_meta: number; fecha_corte: string
  pondera: boolean; peso_estrategico: number; alfa_exceso: number
  tope_maximo: string | number; umbral_completitud: number
  rango_min: string | number; rango_max: string | number
  dias_max_retraso: number; justificacion: string
}

interface Props {
  initialMetas: Meta[]
  initialPoliticas: Politica[]
  indicadores: Indicador[]
  programas: Programa[]
  ciclos: Ciclo[]
}

const defaultForm = (meta: Meta | null, pol: Politica | null): RowForm => ({
  valor_meta: meta?.valor_meta ?? 0,
  fecha_corte: meta?.fecha_corte ?? '',
  pondera: pol?.pondera ?? true,
  peso_estrategico: pol?.peso_estrategico ?? 1,
  alfa_exceso: pol?.alfa_exceso ?? 1,
  tope_maximo: pol?.tope_maximo ?? '',
  umbral_completitud: pol?.umbral_completitud ?? 0.8,
  rango_min: pol?.rango_min ?? '',
  rango_max: pol?.rango_max ?? '',
  dias_max_retraso: pol?.dias_max_retraso ?? 5,
  justificacion: pol?.justificacion ?? '',
})

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground/80 mb-1">
      {label}{hint && <span className="font-normal text-muted-foreground/50 ml-1">{hint}</span>}
    </label>
    {children}
  </div>
)

const cls = "w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-luker-brown focus:outline-none"

export default function MetasPoliticasClient({ initialMetas, initialPoliticas, indicadores, programas, ciclos }: Props) {
  const supabase = createClient()
  const [metas, setMetas] = useState<Meta[]>(initialMetas)
  const [politicas, setPoliticas] = useState<Politica[]>(initialPoliticas)
  const [filtroCiclo, setFiltroCiclo] = useState<string>(ciclos.find(c => c.activo)?.id ?? ciclos[0]?.id ?? '')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, RowForm>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const programasDeCiclo = filtroCiclo ? programas.filter(p => p.ciclo_id === filtroCiclo) : programas
  const indicadoresFiltrados = indicadores.filter(i => {
    if (filtroPrograma) return i.programa_id === filtroPrograma
    if (filtroCiclo) return programasDeCiclo.some(p => p.id === i.programa_id)
    return true
  })

  const getMeta = (indId: string) => metas.find(m => m.indicador_id === indId && m.ciclo_id === filtroCiclo) ?? null
  const getPol = (indId: string) => politicas.find(p => p.indicador_id === indId && p.ciclo_id === filtroCiclo) ?? null
  const programaNombre = (id: string) => programas.find(p => p.id === id)?.nombre ?? '—'

  const toggleExpand = (indId: string) => {
    if (expandedId === indId) {
      setExpandedId(null)
      return
    }
    const meta = getMeta(indId)
    const pol = getPol(indId)
    setForms(f => ({ ...f, [indId]: defaultForm(meta, pol) }))
    setExpandedId(indId)
  }

  const setField = (indId: string, patch: Partial<RowForm>) => {
    setForms(f => ({ ...f, [indId]: { ...f[indId], ...patch } }))
  }

  const handleSave = async (e: React.FormEvent, ind: Indicador) => {
    e.preventDefault()
    if (!filtroCiclo) return
    setSaving(ind.id)

    const f = forms[ind.id]
    const existingMeta = getMeta(ind.id)
    const existingPol = getPol(ind.id)

    const metaPayload = {
      indicador_id: ind.id, ciclo_id: filtroCiclo,
      valor_meta: f.valor_meta, fecha_corte: f.fecha_corte,
    }
    const polPayload = {
      indicador_id: ind.id, ciclo_id: filtroCiclo,
      pondera: f.pondera,
      peso_estrategico: f.peso_estrategico,
      alfa_exceso: f.alfa_exceso,
      tope_maximo: f.tope_maximo === '' ? null : Number(f.tope_maximo),
      umbral_completitud: f.umbral_completitud,
      rango_min: f.rango_min === '' ? null : Number(f.rango_min),
      rango_max: f.rango_max === '' ? null : Number(f.rango_max),
      dias_max_retraso: f.dias_max_retraso,
      justificacion: f.justificacion || null,
    }

    const { data: mData, error: mErr } = existingMeta
      ? await supabase.from('metas').update(metaPayload).eq('id', existingMeta.id).select().single()
      : await supabase.from('metas').insert(metaPayload).select().single()

    const { data: pData, error: pErr } = existingPol
      ? await supabase.from('politicas_calidad').update(polPayload).eq('id', existingPol.id).select().single()
      : await supabase.from('politicas_calidad').insert(polPayload).select().single()

    if (mErr || pErr) {
      alert('Error al guardar: ' + (mErr?.message ?? pErr?.message))
    } else {
      if (mData) setMetas(prev => existingMeta ? prev.map(m => m.id === mData.id ? mData : m) : [...prev, mData])
      if (pData) setPoliticas(prev => existingPol ? prev.map(p => p.id === pData.id ? pData : p) : [...prev, pData])
      setExpandedId(null)
    }
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filtroCiclo} onChange={e => { setFiltroCiclo(e.target.value); setFiltroPrograma(''); setExpandedId(null) }}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown">
          <option value="">Selecciona un ciclo...</option>
          {ciclos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={filtroPrograma} onChange={e => setFiltroPrograma(e.target.value)}
          className="border border-border rounded-lg p-2 text-sm bg-muted/30 focus:outline-none focus:ring-1 focus:ring-luker-brown">
          <option value="">Todos los programas / iniciativas</option>
          {programasDeCiclo.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {filtroCiclo && (
          <ImportarExcel
            templateName="Plantilla_Metas_Politicas"
            cols={[
              { key: 'indicador_nombre', header: 'Indicador', required: true, type: 'string' },
              { key: 'valor_meta', header: 'Valor Meta', required: true, type: 'number' },
              { key: 'fecha_corte', header: 'Fecha Corte', required: true, type: 'date' },
              { key: 'pondera', header: 'Pondera (Sí/No)', type: 'boolean' },
              { key: 'peso_estrategico', header: 'Peso Estratégico (1-5)', type: 'number' },
              { key: 'alfa_exceso', header: 'Alfa Exceso (%)', type: 'number' },
              { key: 'tope_maximo', header: 'Tope Máximo (%)', type: 'number' },
              { key: 'umbral_completitud', header: 'Umbral Completitud', type: 'number' },
              { key: 'dias_max_retraso', header: 'Días Máx Retraso', type: 'number' },
            ]}
            validations={{
              indicador_nombre: indicadores.filter(i => programasDeCiclo.some(p => p.id === i.programa_id)).map(i => i.nombre),
              pondera: ['true', 'false']
            }}
            templateRows={indicadores.filter(i => programasDeCiclo.some(p => p.id === i.programa_id)).map(i => ({
              indicador_nombre: i.nombre,
              valor_meta: '',
              fecha_corte: '',
              pondera: '',
              peso_estrategico: '',
              alfa_exceso: '',
              tope_maximo: '',
              umbral_completitud: '',
              dias_max_retraso: ''
            }))}
            onImport={async (rows) => {
              let ok = 0; const errors: string[] = []
              for (const row of rows) {
                const ind = indicadores.find(i => i.nombre === row.indicador_nombre)
                if (!ind) { errors.push(`Indicador "${row.indicador_nombre}" no encontrado`); continue }
                const mp = { indicador_id: ind.id, ciclo_id: filtroCiclo, valor_meta: row.valor_meta as number, fecha_corte: row.fecha_corte as string }
                const pp = {
                  indicador_id: ind.id, ciclo_id: filtroCiclo, pondera: row.pondera !== false,
                  peso_estrategico: (row.peso_estrategico as number) ?? 1, alfa_exceso: (row.alfa_exceso as number) ?? 1,
                  umbral_completitud: (row.umbral_completitud as number) ?? 0.8, dias_max_retraso: (row.dias_max_retraso as number) ?? 5,
                  tope_maximo: row.tope_maximo != null ? row.tope_maximo as number : null,
                  rango_min: row.rango_min != null ? row.rango_min as number : null,
                  rango_max: row.rango_max != null ? row.rango_max as number : null,
                }
                const em = metas.find(m => m.indicador_id === ind.id && m.ciclo_id === filtroCiclo)
                const ep = politicas.find(p => p.indicador_id === ind.id && p.ciclo_id === filtroCiclo)
                const { data: mD, error: mE } = em ? await supabase.from('metas').update(mp).eq('id', em.id).select().single() : await supabase.from('metas').insert(mp).select().single()
                const { data: pD, error: pE } = ep ? await supabase.from('politicas_calidad').update(pp).eq('id', ep.id).select().single() : await supabase.from('politicas_calidad').insert(pp).select().single()
                if (mE || pE) { errors.push((mE ?? pE)!.message); continue }
                if (mD) setMetas(prev => em ? prev.map(m => m.id === mD.id ? mD : m) : [...prev, mD])
                if (pD) setPoliticas(prev => ep ? prev.map(p => p.id === pD.id ? pD : p) : [...prev, pD])
                ok++
              }
              return { ok, errors }
            }}
          />
        )}
        {!filtroCiclo && <p className="text-sm text-amber-600 font-medium">Selecciona un ciclo para comenzar.</p>}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground/80">Indicador</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Programa / Iniciativa</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Meta</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Fecha corte</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Pondera</th>
              <th className="p-4 font-semibold text-muted-foreground/80">Peso</th>
              <th className="p-4 font-semibold text-muted-foreground/80 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {!filtroCiclo ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground/50 italic">Selecciona un ciclo para comenzar.</td></tr>
            ) : indicadoresFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground italic">No hay indicadores en este ciclo.</td></tr>
            ) : (
              indicadoresFiltrados.map(ind => {
                const meta = getMeta(ind.id)
                const pol = getPol(ind.id)
                const isOpen = expandedId === ind.id
                const f = forms[ind.id]
                const isSavingThis = saving === ind.id
                const configured = !!(meta || pol)

                return (
                  <React.Fragment key={ind.id}>
                    {/* Fila resumen */}
                    <tr
                      className={`border-t border-gray-100 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : 'bg-card hover:bg-muted/30'}`}
                      onClick={() => toggleExpand(ind.id)}
                    >
                      <td className="p-4 font-bold text-foreground max-w-[180px]">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                          <span className="line-clamp-2">{ind.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{programaNombre(ind.programa_id)}</td>
                      <td className="p-4 font-semibold text-foreground">
                        {meta ? meta.valor_meta : <span className="text-amber-500 text-xs font-semibold">Sin definir</span>}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {meta ? meta.fecha_corte : '—'}
                      </td>
                      <td className="p-4">
                        {pol ? (pol.pondera ? <span className="text-green-700 font-bold text-xs">Sí</span> : <span className="text-muted-foreground/50 text-xs">No</span>)
                          : <span className="text-amber-500 text-xs">Sin definir</span>}
                      </td>
                      <td className="p-4 text-muted-foreground/80 text-xs">{pol ? pol.peso_estrategico : '—'}</td>
                      <td className="p-4 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          configured
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {configured ? 'Configurado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>

                    {/* Fila expandible */}
                    {isOpen && f && (
                      <tr className="border-t border-blue-200 bg-blue-50/60">
                        <td colSpan={7} className="px-6 py-5">
                          <form onSubmit={e => handleSave(e, ind)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* META */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Meta</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Valor Meta">
                                    <input required type="number" step="any" value={f.valor_meta}
                                      onChange={e => setField(ind.id, { valor_meta: Number(e.target.value) })} className={cls} />
                                  </Field>
                                  <Field label="Fecha de Corte">
                                    <input required type="date" value={f.fecha_corte}
                                      onChange={e => setField(ind.id, { fecha_corte: e.target.value })} className={cls} />
                                  </Field>
                                </div>
                              </div>

                              {/* POLÍTICA */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Política de Calidad</h4>
                                <div className="flex items-center gap-2">
                                  <input id={`pondera-${ind.id}`} type="checkbox" checked={f.pondera}
                                    onChange={e => setField(ind.id, { pondera: e.target.checked })}
                                    className="w-4 h-4 accent-luker-brown" />
                                  <label htmlFor={`pondera-${ind.id}`} className="text-xs font-bold text-foreground/90">Pondera en el score</label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <Field label="Peso Estratégico">
                                    <input type="number" step="any" min="0" value={f.peso_estrategico}
                                      onChange={e => setField(ind.id, { peso_estrategico: Number(e.target.value) })} className={cls} />
                                  </Field>
                                  <Field label="Alfa Exceso">
                                    <input type="number" step="any" min="0" value={f.alfa_exceso}
                                      onChange={e => setField(ind.id, { alfa_exceso: Number(e.target.value) })} className={cls} />
                                  </Field>
                                  <Field label="Umbral Completitud" hint="(0-1)">
                                    <input type="number" step="0.01" min="0" max="1" value={f.umbral_completitud}
                                      onChange={e => setField(ind.id, { umbral_completitud: Number(e.target.value) })} className={cls} />
                                  </Field>
                                  <Field label="Días Máx. Retraso">
                                    <input type="number" min="0" value={f.dias_max_retraso}
                                      onChange={e => setField(ind.id, { dias_max_retraso: Number(e.target.value) })} className={cls} />
                                  </Field>
                                  <Field label="Tope Máximo" hint="(opcional)">
                                    <input type="number" step="any" value={f.tope_maximo} placeholder="—"
                                      onChange={e => setField(ind.id, { tope_maximo: e.target.value })} className={cls} />
                                  </Field>
                                  <Field label="Rango Mín." hint="(opcional)">
                                    <input type="number" step="any" value={f.rango_min} placeholder="—"
                                      onChange={e => setField(ind.id, { rango_min: e.target.value })} className={cls} />
                                  </Field>
                                  <Field label="Rango Máx." hint="(opcional)">
                                    <input type="number" step="any" value={f.rango_max} placeholder="—"
                                      onChange={e => setField(ind.id, { rango_max: e.target.value })} className={cls} />
                                  </Field>
                                </div>
                              </div>
                            </div>

                            {/* Justificación full-width */}
                            <div className="mt-4">
                              <Field label="Justificación" hint="(opcional)">
                                <textarea value={f.justificacion} rows={2} placeholder="Describe el criterio de esta política..."
                                  onChange={e => setField(ind.id, { justificacion: e.target.value })}
                                  className={`${cls} resize-none`} />
                              </Field>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-200">
                              <button type="button" onClick={() => setExpandedId(null)}
                                className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-card rounded-lg text-sm transition-colors">
                                Cancelar
                              </button>
                              <button type="submit" disabled={isSavingThis}
                                className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50">
                                {isSavingThis ? 'Guardando...' : 'Guardar Meta y Política'}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
