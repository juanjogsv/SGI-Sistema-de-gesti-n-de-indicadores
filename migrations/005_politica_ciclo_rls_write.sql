-- ============================================================
-- Migración 005: Políticas RLS de escritura para politica_ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

create policy "Admin modifica política del ciclo"
  on public.politica_ciclo for all
  using (
    exists (select 1 from public.usuarios where auth_user_id = auth.uid() and rol_global = 'admin')
  )
  with check (
    exists (select 1 from public.usuarios where auth_user_id = auth.uid() and rol_global = 'admin')
  );
