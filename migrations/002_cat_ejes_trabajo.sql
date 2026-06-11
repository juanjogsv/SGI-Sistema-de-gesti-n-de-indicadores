-- ============================================================
-- Migración: Catálogo de Ejes de Trabajo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

create table if not exists public.cat_ejes_trabajo (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- Poblar con los valores únicos que ya existen en programas
insert into public.cat_ejes_trabajo (codigo, nombre, orden)
select
  lower(regexp_replace(eje_trabajo, '\s+', '_', 'g')) as codigo,
  eje_trabajo as nombre,
  row_number() over (order by eje_trabajo) as orden
from (select distinct eje_trabajo from public.programas) t
on conflict (codigo) do nothing;

-- RLS: lectura pública
alter table public.cat_ejes_trabajo enable row level security;

create policy "Lectura pública de catálogos"
  on public.cat_ejes_trabajo for select using (true);
