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
  pondera: boolean; peso_estrategico: number
  justificacion: string | null
}

interface PoliticaCiclo {
  id: string; ciclo_id: string
  alfa_exceso: number; tope_maximo: number; dias_max_retraso: number
  justificacion: string | null
}

interface RowForm {
  valor_meta: number; fecha_corte: string
  pondera: boolean; peso_estrategico: number
}

interface CicloForm {
  alfa_exceso: number; tope_maximo: number; dias_max_retraso: number; justificacion: string
}

interface Props {
  initialMetas: Meta[]
  initialPoliticas: Politica[]
  initialPoliticasCiclo: PoliticaCiclo[]
  indicadores: Indicador[]
  programas: Programa[]
  ciclos: Ciclo[]
}

const defaultRowForm = (meta: Meta | null, pol: Politica | null): RowForm => ({
  valor_meta: meta?.valor_meta ?? 0,
  fecha_corte: meta?.fecha_corte ?? '',
  pondera: pol?.pondera ?? true,
  peso_estrategico: pol?.peso_estrategico ?? 1,
})

const defaultCicloForm = (pc: PoliticaCiclo | null): CicloForm => ({
  alfa_exceso: pc?.alfa_exceso ?? 4.5,
  tope_maximo: pc?.tope_maximo ?? 150,
  dias_max_retraso: pc?.dias_max_retraso ?? 5,
  justificacion: pc?.justificacion ?? '',
})

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground/80 mb-1">
      {label}{hint && <span className="font-normal text-muted-foreground/50 ml-1">{hint}</span>}
    </label>
    {children}
  </div>
)

const cls = "w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-luker-brown focus:outline-none bg-background"

export default function MetasPoliticasClient({ initialMetas, initialPoliticas, initialPoliticasCiclo, indicadores, programas, ciclos }: Props) {
  const supabase = createClient()
  const [metas, setMetas] = useState<Meta[]>(initialMetas)
  const [politicas, setPoliticas] = useState<Politica[]>(initialPoliticas)
  const [politicasCiclo, setPoliticasCiclo] = useState<PoliticaCiclo[]>(initialPoliticasCiclo)
  const [filtroCiclo, setFiltroCiclo] = useState<string>(ciclos.find(c => c.activo)?.id ?? ciclos[0]?.id ?? '')
  const [filtroPrograma, setFiltroPrograma] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, RowForm>>({})
  const [saving, setSaving] = useState<string | null>(null)

  // Política general del ciclo
  const getPoliticaCiclo = () => politicasCiclo.find(pc => pc.ciclo_id === filtroCiclo) ?? null
  const [cicloForm, setCicloForm] = useState<CicloForm>(() => defaultCicloForm(null))
  const [editingCiclo, setEditingCiclo] = useState(false)
  const [savingCiclo, setSavingCiclo] = useState(false)

  const openCicloEdit = () => {
    setCicloForm(defaultCicloForm(getPoliticaCiclo()))
    setEditingCiclo(true)
  }

  const handleSaveCiclo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filtroCiclo) return
    setSavingCiclo(true)
    const existing = getPoliticaCiclo()
    const payload = {
      ciclo_id: filtroCiclo,
      alfa_exceso: cicloForm.alfa_exceso,
      tope_maximo: cicloForm.tope_maximo,
      dias_max_retraso: cicloForm.dias_max_retraso,
      justificacion: cicloForm.justificacion || null,
    }
    const { data, error } = await supabase
      .from('politica_ciclo')
      .upsert(payload, { onConflict: 'ciclo_id' })
      .select()
      .single()
    if (error) {
      alert('Error al guardar política del ciclo: ' + error.message)
    } else if (data) {
      setPoliticasCiclo(prev => {
        const idx = prev.findIndex(pc => pc.ciclo_id === filtroCiclo)
        return idx >= 0 ? prev.map((pc, i) => i === idx ? data : pc) : [...prev, data]
      })
      setEditingCiclo(false)
    }
    setSavingCiclo(false)
  }

  // Per-indicator
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
    if (expandedId === indId) { setExpandedId(null); return }
    setForms(f => ({ ...f, [indId]: defaultRowForm(getMeta(indId), getPol(indId)) }))
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

    const metaPayload = { indicador_id: ind.id, ciclo_id: filtroCiclo, valor_meta: f.valor_meta, fecha_corte: f.fecha_corte }
    const polPayload = { indicador_id: ind.id, ciclo_id: filtroCiclo, pondera: f.pondera, peso_estrategico: f.peso_estrategico }

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

  const pc = getPoliticaCiclo()

  return (
    <div className="space-y-6">
      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={filtroCiclo} onChange={e => { setFiltroCiclo(e.target.value); setFiltroPrograma(''); setExpandedId(null); setEditingCiclo(false) }}
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
              { key: 'pondera', header: 'Pondera (true/false)', type: 'boolean' },
              { key: 'peso_estrategico', header: 'Peso Estratégico', type: 'number' },
            ]}
            validations={{
              indicador_nombre: indicadores.filter(i => programasDeCiclo.some(p => p.id === i.programa_id)).map(i => i.nombre),
              pondera: ['true', 'false']
            }}
            templateRows={indicadores.filter(i => programasDeCiclo.some(p => p.id === i.programa_id)).map(i => {
              const meta = getMeta(i.id); const pol = getPol(i.id)
              return {
                indicador_nombre: i.nombre,
                valor_meta: meta ? meta.valor_meta : '',
                fecha_corte: meta ? meta.fecha_corte : '',
                pondera: pol ? (pol.pondera ? 'true' : 'false') : '',
                peso_estrategico: pol ? pol.peso_estrategico : '',
              }
            })}
            onImport={async (rows) => {
              let ok = 0; const errors: string[] = []
              for (const row of rows) {
                const ind = indicadores.find(i => i.nombre === row.indicador_nombre)
                if (!ind) { errors.push(`Indicador "${row.indicador_nombre}" no encontrado`); continue }
                const mp = { indicador_id: ind.id, ciclo_id: filtroCiclo, valor_meta: row.valor_meta as number, fecha_corte: row.fecha_corte as string }
                const pp = { indicador_id: ind.id, ciclo_id: filtroCiclo, pondera: row.pondera !== false, peso_estrategico: (row.peso_estrategico as number) ?? 1 }
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
      </div>

      {/* ── Política General del Ciclo ── */}
      {filtroCiclo && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
            <div>
              <h3 className="text-sm font-black text-foreground">Política General del Ciclo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Parámetros globales que aplican a todos los indicadores del ciclo seleccionado.</p>
            </div>
            {!editingCiclo && (
              <button onClick={openCicloEdit}
                className="text-xs font-bold text-luker-brown hover:underline px-3 py-1.5 border border-luker-brown/30 rounded-lg hover:bg-luker-brown/5 transition-colors">
                {pc ? 'Editar' : 'Configurar'}
              </button>
            )}
          </div>

          {!editingCiclo ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border px-0">
              {[
                { label: 'Alfa Exceso (α)', value: pc ? pc.alfa_exceso : '—', hint: 'Factor compresión' },
                { label: 'Tope Máximo', value: pc ? `${pc.tope_maximo}%` : '—', hint: 'Techo C_efectivo' },
                { label: 'Días Máx. Retraso', value: pc ? pc.dias_max_retraso : '—', hint: 'Días de gracia' },
                { label: 'Justificación', value: pc?.justificacion || '—', hint: '' },
              ].map(({ label, value, hint }) => (
                <div key={label} className="px-5 py-4">
                  <p className="text-xs text-muted-foreground/60 font-medium">{label}</p>
                  {hint && <p className="text-[10px] text-muted-foreground/40 mb-1">{hint}</p>}
                  <p className={`text-sm font-bold ${value === '—' ? 'text-amber-500' : 'text-foreground'}`}>{String(value)}</p>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSaveCiclo} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Alfa Exceso (α)" hint="compresión del exceso">
                  <input required type="number" step="0.1" min="0" value={cicloForm.alfa_exceso}
                    onChange={e => setCicloForm(f => ({ ...f, alfa_exceso: Number(e.target.value) }))} className={cls} />
                </Field>
                <Field label="Tope Máximo (%)" hint="techo de C_efectivo">
                  <input required type="number" step="1" min="100" value={cicloForm.tope_maximo}
                    onChange={e => setCicloForm(f => ({ ...f, tope_maximo: Number(e.target.value) }))} className={cls} />
                </Field>
                <Field label="Días Máx. Retraso" hint="días de gracia">
                  <input required type="number" min="0" value={cicloForm.dias_max_retraso}
                    onChange={e => setCicloForm(f => ({ ...f, dias_max_retraso: Number(e.target.value) }))} className={cls} />
                </Field>
              </div>
              <Field label="Justificación" hint="(opcional)">
                <textarea value={cicloForm.justificacion} rows={2} placeholder="Describe el criterio de esta política del ciclo..."
                  onChange={e => setCicloForm(f => ({ ...f, justificacion: e.target.value }))}
                  className={`${cls} resize-none`} />
              </Field>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button type="button" onClick={() => setEditingCiclo(false)}
                  className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-muted/30 rounded-lg text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCiclo}
                  className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {savingCiclo ? 'Guardando...' : 'Guardar Política del Ciclo'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Ponderación por Indicador ── */}
      {filtroCiclo && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-black text-foreground">Meta y Ponderación por Indicador</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Define la meta, fecha de corte y ponderación estratégica de cada indicador.</p>
          </div>

          <table className="min-w-full text-sm text-left">
            <thead className="border-b border-border">
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
              {indicadoresFiltrados.length === 0 ? (
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
                      <tr
                        className={`border-t border-border cursor-pointer transition-colors ${isOpen ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-card hover:bg-muted/30'}`}
                        onClick={() => toggleExpand(ind.id)}
                      >
                        <td className="p-4 font-bold text-foreground max-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                            <span className="line-clamp-2">{ind.nombre}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{programaNombre(ind.programa_id)}</td>
                        <td className="p-4 font-semibold text-foreground">
                          {meta ? meta.valor_meta : <span className="text-amber-500 text-xs font-semibold">Sin definir</span>}
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{meta ? meta.fecha_corte : '—'}</td>
                        <td className="p-4">
                          {pol
                            ? (pol.pondera ? <span className="text-green-700 font-bold text-xs">Sí</span> : <span className="text-muted-foreground/50 text-xs">No</span>)
                            : <span className="text-amber-500 text-xs">Sin definir</span>}
                        </td>
                        <td className="p-4 text-muted-foreground/80 text-xs">{pol ? pol.peso_estrategico : '—'}</td>
                        <td className="p-4 text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            configured ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {configured ? 'Configurado' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>

                      {isOpen && f && (
                        <tr className="border-t border-blue-200 bg-blue-50/60 dark:bg-blue-950/10">
                          <td colSpan={7} className="px-6 py-5">
                            <form onSubmit={e => handleSave(e, ind)}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Meta del Indicador</h4>
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

                                <div className="space-y-3">
                                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Ponderación</h4>
                                  <div className="flex items-center gap-2">
                                    <input id={`pondera-${ind.id}`} type="checkbox" checked={f.pondera}
                                      onChange={e => setField(ind.id, { pondera: e.target.checked })}
                                      className="w-4 h-4 accent-luker-brown" />
                                    <label htmlFor={`pondera-${ind.id}`} className="text-xs font-bold text-foreground/90">Pondera en el score del programa</label>
                                  </div>
                                  <Field label="Peso Estratégico" hint="(valor relativo)">
                                    <input type="number" step="any" min="0" value={f.peso_estrategico}
                                      onChange={e => setField(ind.id, { peso_estrategico: Number(e.target.value) })} className={cls} />
                                  </Field>
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-200">
                                <button type="button" onClick={() => setExpandedId(null)}
                                  className="text-muted-foreground/80 font-bold px-4 py-2 hover:bg-card rounded-lg text-sm transition-colors">
                                  Cancelar
                                </button>
                                <button type="submit" disabled={isSavingThis}
                                  className="bg-luker-brown hover:bg-luker-brown/90 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50">
                                  {isSavingThis ? 'Guardando...' : 'Guardar'}
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
      )}

      {!filtroCiclo && (
        <p className="text-sm text-amber-600 font-medium text-center py-8">Selecciona un ciclo para comenzar.</p>
      )}
    </div>
  )
}
