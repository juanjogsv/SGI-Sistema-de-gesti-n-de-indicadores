-- ============================================================
-- Migración 006: Triggers de auditoría en tablas críticas
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Registra automáticamente modificado_por (usuario interno)
-- y modificado_en (timestamp) en cada UPDATE, sin depender del cliente.
-- ============================================================


-- 1. FUNCIÓN REUTILIZABLE DE AUDITORÍA
-- ------------------------------------------------------------

create or replace function public.fn_set_modificado()
returns trigger
language plpgsql
security definer
as $$
declare
  v_usuario_id uuid;
begin
  -- Resuelve auth.uid() → usuarios.id (UUID interno)
  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;

  NEW.modificado_por := v_usuario_id;
  NEW.modificado_en  := now();
  return NEW;
end;
$$;


-- 2. COLUMNAS EN metas (no las tiene aún)
-- ------------------------------------------------------------

alter table public.metas
  add column if not exists modificado_por uuid references public.usuarios(id),
  add column if not exists modificado_en  timestamptz not null default now();


-- 3. COLUMNAS EN usuarios (solo tiene actualizado_en)
-- ------------------------------------------------------------

alter table public.usuarios
  add column if not exists modificado_por uuid references public.usuarios(id);

-- Renombrar actualizado_en → modificado_en para consistencia
-- (solo si modificado_en no existe aún)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'usuarios'
      and column_name  = 'modificado_en'
  ) then
    alter table public.usuarios
      rename column actualizado_en to modificado_en;
  end if;
end $$;


-- 4. TRIGGERS
-- ------------------------------------------------------------

-- politicas_calidad
drop trigger if exists trg_politicas_calidad_audit on public.politicas_calidad;
create trigger trg_politicas_calidad_audit
  before insert or update on public.politicas_calidad
  for each row execute function public.fn_set_modificado();

-- metas
drop trigger if exists trg_metas_audit on public.metas;
create trigger trg_metas_audit
  before insert or update on public.metas
  for each row execute function public.fn_set_modificado();

-- usuarios
drop trigger if exists trg_usuarios_audit on public.usuarios;
create trigger trg_usuarios_audit
  before update on public.usuarios
  for each row execute function public.fn_set_modificado();
