-- Había dos overloads de crear_reserva_publica (uno sin p_email, otro con
-- p_email + teléfono obligatorio) que hacían ambigua cualquier llamada RPC
-- sin p_email, rompiendo el formulario público de reservas. Se elimina el
-- overload antiguo y se relaja el nuevo para que el teléfono siga siendo
-- opcional, que es el comportamiento que espera el frontend actual.

drop function if exists public.crear_reserva_publica(
  uuid, text, integer, date, time without time zone, text, text
);

create or replace function public.crear_reserva_publica(
  p_site_key uuid,
  p_nombre_cliente text,
  p_num_personas integer,
  p_fecha date,
  p_hora time without time zone,
  p_telefono text default null::text,
  p_notas text default null::text,
  p_email text default null::text
)
returns restaurant.reservas
language plpgsql
security definer
set search_path to 'public', 'restaurant'
as $function$
declare
  v_cliente_id uuid;
  v_row restaurant.reservas;
begin
  v_cliente_id := public.cliente_id_from_site_key(p_site_key);
  if v_cliente_id is null then
    raise exception 'site_key inválida';
  end if;

  if trim(coalesce(p_nombre_cliente, '')) = '' then
    raise exception 'Falta el nombre para la reserva';
  end if;

  if p_num_personas is null or p_num_personas < 1 or p_num_personas > 30 then
    raise exception 'Número de personas no válido';
  end if;

  if p_fecha < (now() at time zone 'Europe/Madrid')::date then
    raise exception 'La fecha de la reserva no puede ser en el pasado';
  end if;

  insert into restaurant.reservas
    (cliente_id, nombre_cliente, num_personas, fecha, hora, telefono, notas, email)
  values
    (v_cliente_id, trim(p_nombre_cliente), p_num_personas, p_fecha, p_hora,
     nullif(trim(coalesce(p_telefono, '')), ''),
     nullif(trim(coalesce(p_notas, '')), ''),
     nullif(trim(coalesce(p_email, '')), ''))
  returning * into v_row;

  return v_row;
end;
$function$;

grant execute on function public.crear_reserva_publica(
  uuid, text, integer, date, time without time zone, text, text, text
) to anon, authenticated, service_role;
