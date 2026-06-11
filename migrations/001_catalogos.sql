-- ============================================================
-- Migración: Crear tablas de catálogos y migrar enums a texto
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. CREAR TABLAS DE CATÁLOGOS
-- ------------------------------------------------------------

create table if not exists public.cat_tipos_dato (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.cat_niveles_logico (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.cat_frecuencias (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- 2. POBLAR CON LOS VALORES ACTUALES DE LOS ENUMS
-- ------------------------------------------------------------

insert into public.cat_tipos_dato (codigo, nombre, orden) values
  ('porcentaje', 'Porcentaje (%)',    1),
  ('absoluto',   'Valor Absoluto',    2),
  ('indice',     'Índice',            3),
  ('cualitativo','Cualitativo',       4)
on conflict (codigo) do nothing;

insert into public.cat_niveles_logico (codigo, nombre, orden) values
  ('resultado', 'Resultado', 1),
  ('impacto',   'Impacto',   2),
  ('producto',  'Producto',  3),
  ('proceso',   'Proceso',   4),
  ('insumo',    'Insumo',    5)
on conflict (codigo) do nothing;

insert into public.cat_frecuencias (codigo, nombre, orden) values
  ('mensual',    'Mensual',    1),
  ('trimestral', 'Trimestral', 2),
  ('semestral',  'Semestral',  3),
  ('anual',      'Anual',      4)
on conflict (codigo) do nothing;

-- 3. MIGRAR LA TABLA indicadores: reemplazar enums por text
-- (los valores existentes son iguales a los códigos, no se pierde nada)
-- ------------------------------------------------------------

alter table public.indicadores
  alter column nivel_logico     type text using nivel_logico::text,
  alter column tipo_dato        type text using tipo_dato::text,
  alter column frecuencia_reporte type text using frecuencia_reporte::text;

-- 4. AGREGAR FOREIGN KEYS SUAVES (opcional pero recomendado)
-- ------------------------------------------------------------

alter table public.indicadores
  add constraint fk_indicadores_tipo_dato
    foreign key (tipo_dato) references public.cat_tipos_dato(codigo),
  add constraint fk_indicadores_nivel_logico
    foreign key (nivel_logico) references public.cat_niveles_logico(codigo),
  add constraint fk_indicadores_frecuencia
    foreign key (frecuencia_reporte) references public.cat_frecuencias(codigo);

-- 5. RLS: los catálogos son públicos para lectura, solo admin puede escribir
-- ------------------------------------------------------------

alter table public.cat_tipos_dato    enable row level security;
alter table public.cat_niveles_logico enable row level security;
alter table public.cat_frecuencias    enable row level security;

create policy "Lectura pública de catálogos"
  on public.cat_tipos_dato for select using (true);
create policy "Lectura pública de catálogos"
  on public.cat_niveles_logico for select using (true);
create policy "Lectura pública de catálogos"
  on public.cat_frecuencias for select using (true);
