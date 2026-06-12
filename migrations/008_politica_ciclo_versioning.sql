-- ============================================================
-- Migración 008: Versionado de politica_ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Cada cambio en la política del ciclo crea una nueva versión.
-- La versión activa tiene vigente_hasta IS NULL.
-- Historial completo disponible para auditoría y reproducción.
-- ============================================================


-- 1. AGREGAR COLUMNAS DE VERSIONADO
-- ------------------------------------------------------------

alter table public.politica_ciclo
  add column if not exists version        int          not null default 1,
  add column if not exists vigente_desde  timestamptz  not null default now(),
  add column if not exists vigente_hasta  timestamptz  null,
  add column if not exists creado_por     uuid         references public.usuarios(id);

-- El campo modificado_por/modificado_en ya no aplica aquí:
-- cada versión es inmutable una vez cerrada. creado_por registra quién la creó.
alter table public.politica_ciclo
  drop column if exists modificado_por,
  drop column if exists modificado_en;


-- 2. MIGRAR DATOS EXISTENTES
-- ------------------------------------------------------------
-- Los registros actuales pasan a ser versión 1, vigentes desde su creado_en

update public.politica_ciclo
  set version       = 1,
      vigente_desde = creado_en,
      vigente_hasta = null;


-- 3. CAMBIAR UNIQUE CONSTRAINT
-- ------------------------------------------------------------
-- Ya no es unique(ciclo_id) — puede haber múltiples versiones por ciclo.
-- Nuevo unique: (ciclo_id, version)

alter table public.politica_ciclo
  drop constraint if exists politica_ciclo_ciclo_unique;

alter table public.politica_ciclo
  add constraint politica_ciclo_ciclo_version_unique unique (ciclo_id, version);

-- Índice para consultas rápidas de versión activa
create index if not exists idx_politica_ciclo_activa
  on public.politica_ciclo (ciclo_id)
  where vigente_hasta is null;


-- 4. FUNCIÓN PARA CREAR NUEVA VERSIÓN
-- ------------------------------------------------------------
-- Cierra la versión activa y crea una nueva.
-- Llamar desde el frontend o directamente desde SQL.

create or replace function public.fn_nueva_version_politica_ciclo(
  p_ciclo_id        uuid,
  p_alfa_exceso     numeric,
  p_tope_maximo     numeric,
  p_dias_max_retraso int,
  p_justificacion   text default null
)
returns public.politica_ciclo
language plpgsql
security definer
as $$
declare
  v_usuario_id  uuid;
  v_next_version int;
  v_nueva        public.politica_ciclo;
begin
  -- Resolver usuario
  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;

  -- Calcular próxima versión
  select coalesce(max(version), 0) + 1
  into v_next_version
  from public.politica_ciclo
  where ciclo_id = p_ciclo_id;

  -- Cerrar versión activa actual
  update public.politica_ciclo
  set vigente_hasta = now()
  where ciclo_id = p_ciclo_id
    and vigente_hasta is null;

  -- Insertar nueva versión
  insert into public.politica_ciclo (
    ciclo_id, version, vigente_desde, vigente_hasta,
    alfa_exceso, tope_maximo, dias_max_retraso, justificacion,
    creado_por, creado_en
  )
  values (
    p_ciclo_id, v_next_version, now(), null,
    p_alfa_exceso, p_tope_maximo, p_dias_max_retraso, p_justificacion,
    v_usuario_id, now()
  )
  returning * into v_nueva;

  return v_nueva;
end;
$$;


-- 5. RECREAR v_cuadro_mando LEYENDO SOLO VERSIÓN ACTIVA
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
  pol.version                                                       as politica_version,
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
left join politica_ciclo    pol on pol.ciclo_id = c.id and pol.vigente_hasta is null
left join reportes          r   on r.indicador_id = i.id
                                and r.ciclo_id    = c.id
                                and r.estado      = 'aprobado'::estado_reporte_enum;


-- 6. RLS para nuevas versiones (SELECT ya existía)
-- ------------------------------------------------------------

drop policy if exists "Admin modifica política del ciclo" on public.politica_ciclo;

create policy "Admin modifica política del ciclo"
  on public.politica_ciclo for all
  using (
    exists (select 1 from public.usuarios where auth_user_id = auth.uid() and rol_global = 'admin')
  )
  with check (
    exists (select 1 from public.usuarios where auth_user_id = auth.uid() and rol_global = 'admin')
  );
