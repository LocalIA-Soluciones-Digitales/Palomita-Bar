-- Bug: al crear una nueva regla de fidelización, no se evaluaba contra las
-- visitas ya existentes de los comensales. El trigger trg_evaluar_promociones_reserva
-- solo otorga premios cuando una reserva PASA a estado SENTADA, así que un
-- comensal que ya cumplía la regla antes de que esta existiera (p. ej. "sa"
-- 678907944, con 1 visita, y la regla "1 cena" creada después de esa visita)
-- se quedaba sin premio pendiente para siempre, salvo que volviera a visitar.
--
-- Fix: añadir un backfill que se ejecuta al crear/editar una regla activa,
-- evaluando el historial de reservas SENTADA de todos los comensales del
-- cliente contra esa regla. Es idempotente gracias al UNIQUE(reserva_id, regla_id).

create or replace function restaurant.evaluar_promocion_backfill(p_regla_id uuid)
returns void
language plpgsql
set search_path to 'public', 'restaurant'
as $function$
declare
  r restaurant.reglas_promocion%rowtype;
  v_comensal record;
  v_reserva record;
  v_count integer;
begin
  select * into r from restaurant.reglas_promocion where id = p_regla_id and activa;
  if r.id is null then
    return;
  end if;

  for v_comensal in
    select distinct res.comensal_id
    from restaurant.reservas res
    where res.cliente_id = r.cliente_id
      and res.estado = 'SENTADA'
      and res.comensal_id is not null
  loop
    for v_reserva in
      select res.id, res.fecha
      from restaurant.reservas res
      where res.comensal_id = v_comensal.comensal_id
        and res.estado = 'SENTADA'
        and restaurant.hora_en_rango(res.hora, r.hora_desde, r.hora_hasta)
      order by res.fecha, res.hora, res.created_at
    loop
      select count(*) into v_count
      from restaurant.reservas res2
      where res2.comensal_id = v_comensal.comensal_id
        and res2.estado = 'SENTADA'
        and restaurant.hora_en_rango(res2.hora, r.hora_desde, r.hora_hasta)
        and (r.ventana_dias is null or res2.fecha >= v_reserva.fecha - r.ventana_dias)
        and res2.fecha <= v_reserva.fecha;

      if v_count > 0 and v_count % r.visitas_requeridas = 0 then
        insert into restaurant.premios_otorgados
          (cliente_id, comensal_id, regla_id, reserva_id, visitas_alcanzadas)
        values (r.cliente_id, v_comensal.comensal_id, r.id, v_reserva.id, v_count)
        on conflict (reserva_id, regla_id) do nothing;
      end if;
    end loop;
  end loop;
end;
$function$;

create or replace function public.upsert_regla_promocion_admin(p_cliente_id uuid, p_id uuid, p_nombre text, p_hora_desde time without time zone, p_hora_hasta time without time zone, p_visitas_requeridas integer, p_ventana_dias integer, p_premio_descripcion text, p_activa boolean)
 returns restaurant.reglas_promocion
 language plpgsql
 set search_path to 'public', 'restaurant'
as $function$
declare
  v_row restaurant.reglas_promocion;
begin
  if trim(coalesce(p_nombre, '')) = '' then
    raise exception 'Falta el nombre de la regla';
  end if;
  if p_visitas_requeridas is null or p_visitas_requeridas < 1 then
    raise exception 'El número de visitas requeridas no es válido';
  end if;
  if trim(coalesce(p_premio_descripcion, '')) = '' then
    raise exception 'Falta la descripción del premio';
  end if;

  if p_id is null then
    insert into restaurant.reglas_promocion
      (cliente_id, nombre, hora_desde, hora_hasta, visitas_requeridas, ventana_dias, premio_descripcion, activa)
    values
      (p_cliente_id, trim(p_nombre), p_hora_desde, p_hora_hasta, p_visitas_requeridas, p_ventana_dias, trim(p_premio_descripcion), coalesce(p_activa, true))
    returning * into v_row;
  else
    update restaurant.reglas_promocion set
      nombre = trim(p_nombre),
      hora_desde = p_hora_desde,
      hora_hasta = p_hora_hasta,
      visitas_requeridas = p_visitas_requeridas,
      ventana_dias = p_ventana_dias,
      premio_descripcion = trim(p_premio_descripcion),
      activa = coalesce(p_activa, true),
      updated_at = now()
    where id = p_id and cliente_id = p_cliente_id
    returning * into v_row;

    if v_row.id is null then
      raise exception 'Regla no encontrada';
    end if;
  end if;

  if v_row.activa then
    perform restaurant.evaluar_promocion_backfill(v_row.id);
  end if;

  return v_row;
end;
$function$;

-- Backfill puntual: aplica el fix a la regla "1 cena" ya existente para que
-- el comensal de prueba (y cualquier otro que ya cumpliera la regla) obtenga
-- ahora su premio pendiente.
select restaurant.evaluar_promocion_backfill(id)
from restaurant.reglas_promocion
where activa;
