-- ============================================================
-- Migración 005: Políticas RLS de escritura para politica_ciclo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Solo admins y editores pueden insertar/actualizar la política del ciclo

create policy "Admin puede insertar política del ciclo"
  on public.politica_ciclo for insert
  with check (
    exists (
      select 1 from public.usuarios u
      where u.auth_user_id = auth.uid()
        and u.rol_global in ('admin', 'editor')
    )
  );

create policy "Admin puede actualizar política del ciclo"
  on public.politica_ciclo for update
  using (
    exists (
      select 1 from public.usuarios u
      where u.auth_user_id = auth.uid()
        and u.rol_global in ('admin', 'editor')
    )
  );
