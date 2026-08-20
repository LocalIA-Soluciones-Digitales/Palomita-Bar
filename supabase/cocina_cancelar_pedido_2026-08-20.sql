-- Aplicado directamente en el proyecto Supabase compartido (ukhfaphloxlszomccgde) vía MCP,
-- igual que el resto del schema `restaurant` (ver ARCHITECTURE.md §4). Se guarda aquí solo
-- como referencia/histórico, no es un sistema de migraciones que se ejecute automáticamente.
--
-- Objetivo: permitir cancelar una comanda desde cocina/barra en cualquiera de sus columnas
-- (Nuevos, En preparación, Listos), no solo antes de que esté lista. Antes, el trigger de
-- restaurant.pedidos solo dejaba pasar READY -> DELIVERED; ahora también admite
-- READY -> CANCELLED, igual que ya permitía el trigger a nivel de línea de pedido
-- (restaurant.validar_transicion_estado_item_pedido, ver cocina_estado_por_estacion_2026-08-17.sql).
--
-- La cancelación en sí se hace reutilizando la RPC existente public.avanzar_pedido_cocina
-- (p_nuevo_estado = 'CANCELLED'), que ya soportaba ese estado. No hace falta una RPC nueva.

create or replace function restaurant.validar_transicion_estado_pedido()
returns trigger
language plpgsql
security definer
set search_path to 'restaurant', 'public'
as $function$
declare
  v_permitido boolean;
begin
  if new.estado = old.estado then
    return new;
  end if;

  v_permitido := case old.estado
    when 'RECEIVED' then new.estado in ('ACCEPTED', 'CANCELLED')
    when 'ACCEPTED' then new.estado in ('PREPARING', 'CANCELLED')
    when 'PREPARING' then new.estado in ('READY', 'CANCELLED')
    when 'READY' then new.estado in ('DELIVERED', 'CANCELLED')
    else false
  end;

  if not v_permitido then
    raise exception 'Transición de estado no permitida: % -> %', old.estado, new.estado;
  end if;

  insert into restaurant.pedido_estado_historial (pedido_id, estado_anterior, estado_nuevo, user_id)
  values (new.id, old.estado, new.estado, auth.uid());

  new.updated_at := now();
  return new;
end;
$function$;
