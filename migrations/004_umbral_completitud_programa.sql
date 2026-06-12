-- ============================================================
-- Migración 004: Umbral de Completitud a nivel de Programa
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Contexto: umbral_completitud define el % mínimo de indicadores
-- de un programa que deben tener reporte para que el score sea
-- válido. Es una propiedad del programa, no del indicador.
-- ============================================================

alter table public.programas
  add column if not exists umbral_completitud numeric not null default 0.8;

comment on column public.programas.umbral_completitud is
  'Fracción mínima (0-1) de indicadores con reporte para score válido. '
  'Ej: 0.8 = al menos 80% de indicadores deben reportar. '
  'Si se incumple, el score del programa se marca en rojo automáticamente.';
