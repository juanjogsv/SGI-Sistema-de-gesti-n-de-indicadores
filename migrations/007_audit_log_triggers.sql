-- ============================================================
-- Migración 007: Triggers de audit_log para tablas críticas
-- Tablas: ciclos, politica_ciclo, politicas_calidad, metas
-- Ejecutar en Supabase SQL Editor
-- ============================================================


-- 1. FUNCIÓN PRINCIPAL DE AUDITORÍA
-- ------------------------------------------------------------
-- Escribe una fila en audit_log por cada INSERT/UPDATE/DELETE.
-- payload_diff guarda:
--   INSERT → { "new": {...} }
--   UPDATE → { "old": {...}, "new": {...} }
--   DELETE → { "old": {...} }
-- Se puede desactivar por sesión con:
--   SET LOCAL app.audit = 'off';
-- (útil para importaciones masivas)
-- ------------------------------------------------------------

create or replace function public.fn_audit_log()
returns trigger
language plpgsql
security definer
as $$
declare
  v_usuario_id  uuid;
  v_entidad_id  uuid;
  v_diff        jsonb;
begin
  -- Permitir desactivar auditoría por sesión (ej. importaciones masivas)
  if current_setting('app.audit', true) = 'off' then
    if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
  end if;

  -- Resolver usuario interno
  select id into v_usuario_id
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;

  -- ID de la fila afectada
  v_entidad_id := case
    when TG_OP = 'DELETE' then (OLD.id)::uuid
    else (NEW.id)::uuid
  end;

  -- Construir diff
  v_diff := case TG_OP
    when 'INSERT' then jsonb_build_object('new', to_jsonb(NEW))
    when 'DELETE' then jsonb_build_object('old', to_jsonb(OLD))
    when 'UPDATE' then jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  end;

  insert into public.audit_log (entidad, entidad_id, accion, usuario_id, timestamp, payload_diff)
  values (TG_TABLE_NAME, v_entidad_id, TG_OP::public.accion_audit_enum, v_usuario_id, now(), v_diff);

  if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
end;
$$;


-- 2. TRIGGERS POR TABLA
-- ------------------------------------------------------------

-- ciclos
drop trigger if exists trg_ciclos_audit on public.ciclos;
create trigger trg_ciclos_audit
  after insert or update or delete on public.ciclos
  for each row execute function public.fn_audit_log();

-- politica_ciclo
drop trigger if exists trg_politica_ciclo_audit on public.politica_ciclo;
create trigger trg_politica_ciclo_audit
  after insert or update or delete on public.politica_ciclo
  for each row execute function public.fn_audit_log();

-- politicas_calidad
drop trigger if exists trg_politicas_calidad_audit on public.politicas_calidad;
create trigger trg_politicas_calidad_audit
  after insert or update or delete on public.politicas_calidad
  for each row execute function public.fn_audit_log();

-- metas
drop trigger if exists trg_metas_audit on public.metas;
create trigger trg_metas_audit
  after insert or update or delete on public.metas
  for each row execute function public.fn_audit_log();
