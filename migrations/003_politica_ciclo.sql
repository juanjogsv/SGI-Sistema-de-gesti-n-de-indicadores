-- ============================================================
-- Migración 003: Política General del Ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Contexto: alfa_exceso, tope_maximo y dias_max_retraso son
-- parámetros generales del ciclo (no por indicador). Se crean
-- en una tabla nueva y se eliminan de politicas_calidad.
-- ============================================================

-- 1. CREAR TABLA politica_ciclo
-- ------------------------------------------------------------

create table if not exists public.politica_ciclo (
  id             uuid        primary key default gen_random_uuid(),
  ciclo_id       uuid        not null references public.ciclos(id) on delete cascade,
  alfa_exceso    numeric     not null default 4.5,
  tope_maximo    numeric     not null default 150,
  dias_max_retraso int       not null default 5,
  justificacion  text,
  modificado_por uuid        references public.usuarios(id),
  modificado_en  timestamptz not null default now(),
  creado_en      timestamptz not null default now(),
  constraint politica_ciclo_ciclo_unique unique (ciclo_id)
);

comment on table public.politica_ciclo is
  'Parámetros globales de evaluación por ciclo. Una sola fila por ciclo. '
  'Cambios requieren justificación y quedan registrados en audit_log.';

comment on column public.politica_ciclo.alfa_exceso    is 'Factor de compresión del exceso (α). Default 4.5.';
comment on column public.politica_ciclo.tope_maximo    is 'Techo máximo de C_efectivo en %. Default 150.';
comment on column public.politica_ciclo.dias_max_retraso is 'Días de gracia desde fecha_corte para reportar sin penalización.';


-- 2. POBLAR CON VALORES EXISTENTES EN politicas_calidad
-- (tomamos el primer valor de cada ciclo como referencia)
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

-- Si no hay datos en politicas_calidad, crear una fila por cada ciclo existente
insert into public.politica_ciclo (ciclo_id)
select id from public.ciclos
where id not in (select ciclo_id from public.politica_ciclo)
on conflict (ciclo_id) do nothing;


-- 3. ELIMINAR CAMPOS DE politicas_calidad QUE SE MUEVEN A politica_ciclo
-- ------------------------------------------------------------

alter table public.politicas_calidad
  drop column if exists alfa_exceso,
  drop column if exists tope_maximo,
  drop column if exists dias_max_retraso,
  drop column if exists umbral_completitud,
  drop column if exists rango_min,
  drop column if exists rango_max;


-- 4. RLS
-- ------------------------------------------------------------

alter table public.politica_ciclo enable row level security;

create policy "Lectura pública de política del ciclo"
  on public.politica_ciclo for select using (true);
