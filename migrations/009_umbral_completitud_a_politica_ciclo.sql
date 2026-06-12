-- ============================================================
-- Migración 009: Mover umbral_completitud de programas → politica_ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna a politica_ciclo
alter table public.politica_ciclo
  add column if not exists umbral_completitud numeric not null default 0.8;

comment on column public.politica_ciclo.umbral_completitud is
  'Fracción mínima (0-1) de indicadores con reporte para score válido. '
  'Ej: 0.8 = al menos 80% de indicadores deben reportar.';

-- 2. Eliminar columna de programas
alter table public.programas
  drop column if exists umbral_completitud;

-- 3. Recrear fn_nueva_version_politica_ciclo con el nuevo parámetro
create or replace function public.fn_nueva_version_politica_ciclo(
  p_ciclo_id             uuid,
  p_alfa_exceso          numeric,
  p_tope_maximo          numeric,
  p_dias_max_retraso     int,
  p_umbral_completitud   numeric default 0.8,
  p_justificacion        text    default null
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
  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;

  select coalesce(max(version), 0) + 1
  into v_next_version
  from public.politica_ciclo
  where ciclo_id = p_ciclo_id;

  update public.politica_ciclo
  set vigente_hasta = now()
  where ciclo_id = p_ciclo_id
    and vigente_hasta is null;

  insert into public.politica_ciclo (
    ciclo_id, version, vigente_desde, vigente_hasta,
    alfa_exceso, tope_maximo, dias_max_retraso, umbral_completitud,
    justificacion, creado_por, creado_en
  )
  values (
    p_ciclo_id, v_next_version, now(), null,
    p_alfa_exceso, p_tope_maximo, p_dias_max_retraso, p_umbral_completitud,
    p_justificacion, v_usuario_id, now()
  )
  returning * into v_nueva;

  return v_nueva;
end;
$$;
