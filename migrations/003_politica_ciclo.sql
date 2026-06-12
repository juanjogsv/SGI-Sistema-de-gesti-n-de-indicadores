-- ============================================================
-- Migración 003: Política General del Ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. CREAR TABLA politica_ciclo
-- ------------------------------------------------------------

create table if not exists public.politica_ciclo (
  id               uuid        primary key default gen_random_uuid(),
  ciclo_id         uuid        not null references public.ciclos(id) on delete cascade,
  alfa_exceso      numeric     not null default 4.5,
  tope_maximo      numeric     not null default 150,
  dias_max_retraso int         not null default 5,
  justificacion    text,
  modificado_por   uuid        references public.usuarios(id),
  modificado_en    timestamptz not null default now(),
  creado_en        timestamptz not null default now(),
  constraint politica_ciclo_ciclo_unique unique (ciclo_id)
);

comment on column public.politica_ciclo.alfa_exceso      is 'Factor de compresión del exceso (α). Default 4.5.';
comment on column public.politica_ciclo.tope_maximo      is 'Techo máximo de C_efectivo en %. Default 150.';
comment on column public.politica_ciclo.dias_max_retraso is 'Días de gracia desde fecha_corte para reportar sin penalización.';


-- 2. POBLAR CON VALORES EXISTENTES EN politicas_calidad
-- ------------------------------------------------------------

insert into public.politica_ciclo (ciclo_id, alfa_exceso, tope_maximo, dias_max_retraso)
select distinct on (ciclo_id)
  ciclo_id,
  coalesce(alfa_exceso, 4.5),
  coalesce(tope_maximo, 150),
  coalesce(dias_max_retraso, 5)
from public.politicas_calidad
order by ciclo_id, modificado_en desc
on conflict (ciclo_id) do nothing;

-- Crear fila por cada ciclo que no tenga datos en politicas_calidad
insert into public.politica_ciclo (ciclo_id)
select id from public.ciclos
where id not in (select ciclo_id from public.politica_ciclo)
on conflict (ciclo_id) do nothing;


-- 3. RECREAR v_cuadro_mando LEYENDO alfa_exceso Y tope_maximo DESDE politica_ciclo
-- ------------------------------------------------------------

drop view if exists public.v_cuadro_mando;

create view public.v_cuadro_mando as
select
  p.nombre                                                          as programa,
  ce.nombre                                                         as eje_trabajo,
  i.id                                                              as indicador_id,
  i.nombre                                                          as indicador,
  cnl.nombre                                                        as nivel_logico,
  ctd.nombre                                                        as tipo_dato,
  i.es_inverso,
  c.nombre                                                          as ciclo,
  m.valor_meta,
  i.linea_base,
  r.valor_real,
  r.fecha                                                           as fecha_reporte,
  r.estado                                                          as estado_reporte,
  pc.pondera,
  pc.peso_estrategico,
  pol.alfa_exceso,
  pol.tope_maximo,
  fn_cumplimiento(r.valor_real, i.linea_base, m.valor_meta, i.es_inverso)                            as c_pct,
  fn_c_efectivo(
    fn_cumplimiento(r.valor_real, i.linea_base, m.valor_meta, i.es_inverso),
    pol.alfa_exceso,
    pol.tope_maximo
  )                                                                 as c_efectivo,
  fn_semaforo(
    fn_c_efectivo(
      fn_cumplimiento(r.valor_real, i.linea_base, m.valor_meta, i.es_inverso),
      pol.alfa_exceso,
      pol.tope_maximo
    )
  )                                                                 as semaforo
from indicadores i
join  programas          p   on p.id           = i.programa_id
join  ciclos             c   on c.id           = p.ciclo_id and c.activo = true
left join cat_ejes_trabajo  ce  on ce.id       = p.eje_trabajo_id
left join cat_niveles_logico cnl on cnl.id     = i.nivel_logico_id
left join cat_tipos_dato    ctd on ctd.id      = i.tipo_dato_id
left join metas             m   on m.indicador_id = i.id and m.ciclo_id = c.id
left join politicas_calidad pc  on pc.indicador_id = i.id and pc.ciclo_id = c.id
left join politica_ciclo    pol on pol.ciclo_id = c.id
left join reportes          r   on r.indicador_id = i.id
                                and r.ciclo_id    = c.id
                                and r.estado      = 'aprobado'::estado_reporte_enum;


-- 4. ELIMINAR COLUMNAS DE politicas_calidad QUE SE MUEVEN A politica_ciclo
-- (la vista ya no las referencia, el drop es seguro ahora)
-- ------------------------------------------------------------

alter table public.politicas_calidad
  drop column if exists alfa_exceso,
  drop column if exists tope_maximo,
  drop column if exists dias_max_retraso,
  drop column if exists umbral_completitud,
  drop column if exists rango_min,
  drop column if exists rango_max;


-- 5. RLS
-- ------------------------------------------------------------

alter table public.politica_ciclo enable row level security;

create policy "Lectura pública de política del ciclo"
  on public.politica_ciclo for select using (true);
