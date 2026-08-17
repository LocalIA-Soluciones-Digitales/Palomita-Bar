-- Aplicado directamente en el proyecto Supabase compartido (ukhfaphloxlszomccgde) vía MCP,
-- igual que el resto del schema `restaurant` (ver ARCHITECTURE.md §4). Se guarda aquí solo
-- como referencia/histórico, no es un sistema de migraciones que se ejecute automáticamente.
--
-- Objetivo: que cocina solo pueda aceptar/preparar los productos de tipo "comida" de un
-- pedido, y barra solo los de tipo "bebida", en vez de que aceptar/preparar mueva todo el
-- pedido (comida + bebida) a la vez. El pedido completo (`restaurant.pedidos.estado`) sigue
-- existiendo y se recalcula como el progreso mínimo entre ambas estaciones; la entrega final
-- ("Entregado") sigue siendo una acción única sobre el pedido completo.

-- 1. Estado por línea de pedido, independiente por comida/bebida.
alter table restaurant.pedido_items
  add column estado text not null default 'RECEIVED'
  check (estado in ('RECEIVED', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'));

-- Backfill: las líneas de pedidos ya en curso heredan el estado actual del pedido,
-- para no resetear a "RECEIVED" pedidos que ya estaban aceptados/en preparación/listos.
update restaurant.pedido_items pi
set estado = p.estado
from restaurant.pedidos p
where pi.pedido_id = p.id
  and p.estado <> 'RECEIVED';

-- 2. Validación de transición a nivel de línea (misma lógica que a nivel de pedido,
-- salvo que READY también puede cancelarse: una línea ya lista de una estación no debe
-- bloquear la cancelación completa de un pedido mixto).
create or replace function restaurant.validar_transicion_estado_item_pedido()
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
    raise exception 'Transición de estado de línea no permitida: % -> %', old.estado, new.estado;
  end if;

  return new;
end;
$function$;

drop trigger if exists validar_transicion_estado_item_pedido_trigger on restaurant.pedido_items;
create trigger validar_transicion_estado_item_pedido_trigger
before update of estado on restaurant.pedido_items
for each row
execute function restaurant.validar_transicion_estado_item_pedido();

-- 3. avanzar_pedido_cocina: al mover el pedido completo (usado hoy solo para "Entregado"
-- desde cocina, y para el panel de salón), sincroniza también las líneas que se hayan
-- quedado atrás, sin tocar las que ya estén igual o más avanzadas.
create or replace function public.avanzar_pedido_cocina(p_pedido_id uuid, p_nuevo_estado text)
returns void
language plpgsql
set search_path to 'public', 'restaurant'
as $function$
begin
  if p_nuevo_estado not in ('ACCEPTED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED') then
    raise exception 'Estado no válido: %', p_nuevo_estado;
  end if;

  update restaurant.pedidos
  set estado = p_nuevo_estado
  where id = p_pedido_id;

  if not found then
    raise exception 'Pedido no encontrado o sin permiso';
  end if;

  update restaurant.pedido_items
  set estado = p_nuevo_estado
  where pedido_id = p_pedido_id
    and (case estado
      when 'RECEIVED' then 0 when 'ACCEPTED' then 1 when 'PREPARING' then 2
      when 'READY' then 3 when 'DELIVERED' then 4 else 5 end)
      <
      (case p_nuevo_estado
      when 'RECEIVED' then 0 when 'ACCEPTED' then 1 when 'PREPARING' then 2
      when 'READY' then 3 when 'DELIVERED' then 4 else 5 end);
end;
$function$;

-- 4. Nueva RPC: avanza solo las líneas de un tipo (comida/bebida) de un pedido, y
-- recalcula el estado del pedido como el mínimo progreso entre comida y bebida (si
-- solo hay un tipo de producto en el pedido, se comporta igual que antes). Las líneas
-- sin categoría/tipo asignado (producto_tipo null) cuentan para ambas estaciones, igual
-- que ya hacía el filtro visual de KitchenBoard.
create or replace function public.avanzar_items_pedido_cocina(p_pedido_id uuid, p_tipo text, p_nuevo_estado text)
returns void
language plpgsql
set search_path to 'public', 'restaurant'
as $function$
declare
  v_estado_previo text;
  v_rango_comida int;
  v_rango_bebida int;
  v_rango_objetivo int;
  v_estado_objetivo text;
  v_estado_actual text;
  v_siguiente text;
begin
  if p_tipo not in ('comida', 'bebida') then
    raise exception 'Tipo no válido: %', p_tipo;
  end if;

  v_estado_previo := case p_nuevo_estado
    when 'ACCEPTED' then 'RECEIVED'
    when 'PREPARING' then 'ACCEPTED'
    when 'READY' then 'PREPARING'
    else null
  end;

  if v_estado_previo is null then
    raise exception 'Estado no válido: %', p_nuevo_estado;
  end if;

  update restaurant.pedido_items pi
  set estado = p_nuevo_estado
  from restaurant.productos pr
  left join restaurant.categorias cat on cat.id = pr.categoria_id
  where pi.producto_id = pr.id
    and pi.pedido_id = p_pedido_id
    and pi.estado = v_estado_previo
    and (cat.tipo = p_tipo or cat.tipo is null);

  -- Recalcula el estado agregado del pedido a partir de sus líneas.
  select
    min(case cat.tipo
      when 'comida' then rango
      else null end) filter (where cat.tipo = 'comida' or cat.tipo is null),
    min(case cat.tipo
      when 'bebida' then rango
      else null end) filter (where cat.tipo = 'bebida' or cat.tipo is null)
  into v_rango_comida, v_rango_bebida
  from (
    select
      pi.estado,
      cat.tipo,
      case pi.estado
        when 'RECEIVED' then 0 when 'ACCEPTED' then 1 when 'PREPARING' then 2
        when 'READY' then 3 when 'DELIVERED' then 4 else 5
      end as rango
    from restaurant.pedido_items pi
    join restaurant.productos pr on pr.id = pi.producto_id
    left join restaurant.categorias cat on cat.id = pr.categoria_id
    where pi.pedido_id = p_pedido_id
  ) as x(estado, tipo, rango)
  left join restaurant.categorias cat on cat.tipo = x.tipo;

  v_rango_objetivo := least(coalesce(v_rango_comida, 999), coalesce(v_rango_bebida, 999));

  if v_rango_objetivo >= 999 then
    return;
  end if;

  v_estado_objetivo := case v_rango_objetivo
    when 0 then 'RECEIVED' when 1 then 'ACCEPTED' when 2 then 'PREPARING'
    when 3 then 'READY' when 4 then 'DELIVERED' else 'CANCELLED'
  end;

  select estado into v_estado_actual from restaurant.pedidos where id = p_pedido_id;

  while v_estado_actual is distinct from v_estado_objetivo loop
    v_siguiente := case v_estado_actual
      when 'RECEIVED' then 'ACCEPTED'
      when 'ACCEPTED' then 'PREPARING'
      when 'PREPARING' then 'READY'
      when 'READY' then 'DELIVERED'
      else null
    end;
    exit when v_siguiente is null;
    update restaurant.pedidos set estado = v_siguiente where id = p_pedido_id;
    v_estado_actual := v_siguiente;
  end loop;
end;
$function$;

-- 5. get_pedidos_cocina: expone el estado por línea para que el tablero calcule el
-- progreso de cada estación (comida/bebida) de forma independiente.
create or replace function public.get_pedidos_cocina()
returns jsonb
language sql
stable
set search_path to 'public', 'restaurant'
as $function$
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at asc), '[]'::jsonb)
  from (
    select
      o.id,
      o.estado,
      o.payment_method,
      o.payment_status,
      o.notas,
      o.total_centimos,
      o.created_at,
      m.numero as mesa_numero,
      m.nombre as mesa_nombre,
      sp.nombre as participante_nombre,
      (
        select coalesce(jsonb_agg(jsonb_build_object(
          'producto_nombre', p.nombre,
          'producto_tipo', cat.tipo,
          'cantidad', oi.cantidad,
          'notas', oi.notas,
          'estado', oi.estado
        ) order by oi.created_at asc), '[]'::jsonb)
        from restaurant.pedido_items oi
        join restaurant.productos p on p.id = oi.producto_id
        left join restaurant.categorias cat on cat.id = p.categoria_id
        where oi.pedido_id = o.id
      ) as items
    from restaurant.pedidos o
    left join restaurant.mesas m on m.id = o.mesa_id
    left join restaurant.sesion_participantes sp on sp.id = o.participante_id
    where o.estado in ('RECEIVED', 'ACCEPTED', 'PREPARING', 'READY')
      and (o.payment_method = 'LOCAL' or o.payment_status = 'PAID')
  ) t;
$function$;
